# pyright: basic, reportOptionalSubscript = false
import asyncio

import shortuuid
from devtools import debug as d
from fastapi import APIRouter, HTTPException
from typing_extensions import Literal

from python_node_editor.execution.context import progress_context
from python_node_editor.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    topological_order,
)
from python_node_editor.schema import Graph, NodeFromFrontend, NodeUpdate
from python_node_editor.schema_base import CamelBaseModel

router = APIRouter(prefix="/api")

# Time in seconds to keep completed executions before cleanup
EXECUTION_CLEANUP_DELAY = 10


class ExecutionState(CamelBaseModel):
    status: Literal["running", "complete"] = "running"
    node_updates: dict[str, NodeUpdate] = {}
    update_index: int = -1
    last_sent_index: int | None = None


EXECUTIONS: dict[str, ExecutionState] = {}


@router.post("/execution_submit")
async def submit_execution(graph: Graph):
    """Submit a graph for async execution and return an execution ID"""
    execution_id = shortuuid.uuid()

    EXECUTIONS[execution_id] = ExecutionState(status="running")

    asyncio.create_task(execute_graph_async(execution_id, graph))

    return {"execution_id": execution_id}


@router.get("/execution_update/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get the status and updates for a specific execution"""
    if execution_id not in EXECUTIONS:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution_state = EXECUTIONS[execution_id]
    last_sent = execution_state.last_sent_index
    current_index = execution_state.update_index

    # If nothing has changed, return only the index
    if last_sent is not None and current_index == last_sent:
        return {"updateIndex": current_index}

    # Update the last sent index for this execution
    execution_state.last_sent_index = current_index

    # Return the execution state, excluding internal last_sent_index field
    return execution_state.model_dump(exclude={"last_sent_index"}, exclude_none=True)


def push_node_update(
    node_updates: dict[str, NodeUpdate], new_update: NodeUpdate
) -> None:
    """Push a node update into the updates dict, merging with existing if present.

    If an update for the node already exists, dict fields (outputs, arguments) are merged
    and other fields are overwritten. Otherwise, the update is added as new.

    This avoids calling model_dump() to prevent triggering expensive serializers
    (like thumbnail generation for images) during internal merging operations.
    """
    node_id = new_update.node_id

    if node_id not in node_updates:
        node_updates[node_id] = new_update
        return

    # Merge with existing update directly without model_dump()
    existing = node_updates[node_id]

    # Merge outputs dict if new_update has outputs
    if new_update.outputs:
        if not existing.outputs:
            existing.outputs = {}
        existing.outputs.update(new_update.outputs)

    # Merge arguments dict if new_update has arguments
    if new_update.arguments:
        if not existing.arguments:
            existing.arguments = {}
        existing.arguments.update(new_update.arguments)

    # Overwrite scalar fields if provided
    if new_update.status is not None:
        existing.status = new_update.status

    if new_update.terminal_output is not None:
        existing.terminal_output = new_update.terminal_output


async def execute_and_create_update(
    node: NodeFromFrontend,
    graph: Graph,
    execution_list: list[NodeFromFrontend],
    execution_id: str,
    state: ExecutionState,
) -> NodeUpdate:
    """Execute a node and create its update in a single operation.

    Supports incremental updates via flush_output_to_frontend() by setting up
    a progress context that contains both callback and buffer references.
    """

    # Create a single dict to hold both callback and buffer
    # buffer will be filled in by execute_node()
    context_dict = {"callback": None, "buffer": None}

    def on_progress():
        # Read buffer from the same dict
        buffer = context_dict.get("buffer")
        if buffer is None:
            return

        # Read accumulated terminal output
        accumulated = buffer.getvalue()

        # Create partial update with accumulated terminal output
        partial_update = NodeUpdate(
            node_id=node.id,
            terminal_output=accumulated,
        )

        # Push the update
        push_node_update(state.node_updates, partial_update)

        # Increment update_index so frontend sees the update
        state.update_index += 1

    # Store callback in dict
    context_dict["callback"] = on_progress

    # Set the entire dict as a single context variable
    token = progress_context.set(context_dict)

    try:
        # Execute node (will run in thread, with context_dict passed to store buffer)
        success, result, terminal_output = await asyncio.to_thread(
            execute_node,
            node.data,
            context_dict,
            node.id,
            execution_id,
        )
    finally:
        # Always clean up the context variable
        progress_context.reset(token)

    return create_node_update(
        node, success, result, terminal_output, graph, execution_list
    )


async def cleanup_execution(execution_id: str):
    """Remove execution from memory after a delay"""
    await asyncio.sleep(EXECUTION_CLEANUP_DELAY)
    if execution_id in EXECUTIONS:
        del EXECUTIONS[execution_id]
        if VERBOSE:
            print(f"Cleaned up execution {execution_id}")


async def execute_graph_async(execution_id: str, graph: Graph):
    """Execute a graph asynchronously, yielding updates as nodes complete"""

    # Get local reference to execution state
    state = EXECUTIONS[execution_id]

    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    # Iterate through and execute
    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")

        # Send initial update when node starts executing
        executing_update = NodeUpdate(
            node_id=node.id,
            status="executing",
        )

        # Push the "executing" status update
        push_node_update(state.node_updates, executing_update)

        # Increment update_index so the frontend can see the "executing" status update is available
        state.update_index += 1

        # Execute the node with incremental update support
        node_update = await execute_and_create_update(
            node, graph, execution_list, execution_id, state
        )

        # Push the final update
        push_node_update(state.node_updates, node_update)

        # Propagate outputs to downstream nodes and create updates for them
        for edge in graph.edges:
            if edge.source == node.id:
                # Extract the output field name from the source_handle
                output_field_name = edge.source_handle.split(":")[-2]

                # Extract target node ID and argument name
                target_node_id = edge.target
                argument_name = edge.target_handle.split(":")[-2]

                # Update the execution graph so downstream nodes have inputs generated from the output in question
                target_node = next(n for n in execution_list if n.id == target_node_id)
                target_node.data.arguments[argument_name] = node_update.outputs[
                    output_field_name
                ].model_copy()

                # Create an update for the downstream node so we see it's input value change in the UI
                downstream_update = NodeUpdate(
                    node_id=target_node_id,
                    arguments={
                        argument_name: node_update.outputs[
                            output_field_name
                        ].model_copy()
                    },
                )

                # Push the downstream update
                push_node_update(state.node_updates, downstream_update)

        # Increment update_index after execution completes
        state.update_index += 1

        if node_update.status == "error":
            state.status = "complete"
            state.update_index += 1
            asyncio.create_task(cleanup_execution(execution_id))
            return

    state.status = "complete"
    state.update_index += 1

    if VERBOSE:
        d(state)

    # Schedule cleanup after delay
    asyncio.create_task(cleanup_execution(execution_id))
