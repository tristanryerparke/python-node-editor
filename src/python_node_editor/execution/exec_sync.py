from devtools import debug as d
from fastapi import APIRouter

from python_node_editor.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    topological_order,
)
from python_node_editor.schema import Graph, NodeUpdate

router = APIRouter(prefix="/api")


@router.post("/graph_execute")
async def execute_graph_sync(graph: Graph):
    """Execute a graph containing nodes and edges synchronously"""
    from python_node_editor.server import TYPES

    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")
        success, result, terminal_output = execute_node(node.data)

        node_update = create_node_update(
            node, success, result, terminal_output, graph, execution_list
        )

        updates.append(node_update)

        # Propagate outputs to downstream nodes for both execution and visual display
        for edge in graph.edges:
            if edge.source == node.id:
                # Extract the output field name from the source_handle
                output_field_name = edge.source_handle.split(":")[-2]

                # Extract target node ID and argument name
                target_node_id = edge.target
                argument_name = edge.target_handle.split(":")[-2]

                # Update the execution graph so downstream nodes have correct inputs
                target_node = next(n for n in execution_list if n.id == target_node_id)
                target_node.data.arguments[argument_name] = node_update.outputs[
                    output_field_name
                ].model_copy()

                # Create a visual update for the downstream node
                downstream_update = NodeUpdate(
                    node_id=target_node_id,
                    arguments={
                        argument_name: node_update.outputs[
                            output_field_name
                        ].model_copy()
                    },
                )

                updates.append(downstream_update)

    update_message = {
        "status": "success",
        "updates": [update.model_dump(exclude_none=True) for update in updates],
    }

    if VERBOSE:
        d(update_message)

    return update_message
