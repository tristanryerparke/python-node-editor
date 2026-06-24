import shortuuid
from devtools import debug as d
from fastapi import APIRouter, HTTPException

from python_node_editor.execution.exec_utils import (
    VERBOSE,
    create_exception_node_update,
    create_node_update,
    execute_node,
    field_name_from_handle,
    topological_order,
    validate_graph_for_execution,
)
from python_node_editor.schema import Graph, NodeUpdate

router = APIRouter(prefix="/api")


@router.post("/graph_execute")
async def execute_graph_sync(graph: Graph):
    """Execute a graph containing nodes and edges synchronously"""

    try:
        validate_graph_for_execution(graph)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    execution_id = shortuuid.uuid()
    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    execution_node_map = {node.id: node for node in execution_list}
    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")

        try:
            success, result, terminal_output = execute_node(
                node.data, node_id=node.id, execution_id=execution_id
            )

            node_update = create_node_update(
                node, success, result, terminal_output, graph, execution_list
            )

            updates.append(node_update)

            # Stop before propagation when node execution itself failed. Error
            # updates do not contain outputs, so propagating from them would
            # turn the original node error into an internal executor crash.
            if node_update.status == "error":
                break

            if node_update.outputs is None:
                raise RuntimeError(
                    f"Node '{node.id}' executed successfully but produced no outputs"
                )

            # Propagate outputs to downstream nodes for both execution and visual display
            for edge in graph.edges:
                if edge.source == node.id:
                    # Extract the output field name from the source_handle
                    output_field_name = field_name_from_handle(
                        edge.source_handle, "outputs"
                    )
                    if output_field_name not in node_update.outputs:
                        raise RuntimeError(
                            f"Node '{node.id}' did not produce output "
                            f"'{output_field_name}' required by edge '{edge.id}'"
                        )

                    # Extract target node ID and argument name
                    target_node_id = edge.target
                    argument_name = field_name_from_handle(
                        edge.target_handle, ("inputs", "arguments")
                    )

                    output_value = node_update.outputs[output_field_name].model_copy()

                    # Update the execution graph so downstream nodes have correct inputs
                    target_node = execution_node_map[target_node_id]
                    target_node.data.arguments[argument_name] = output_value

                    # Create a visual update for the downstream node
                    downstream_update = NodeUpdate(
                        node_id=target_node_id,
                        arguments={argument_name: output_value.model_copy()},
                    )

                    updates.append(downstream_update)
        except Exception as exc:
            error_update = create_exception_node_update(node.id, exc)
            if updates and updates[-1].node_id == node.id:
                updates[-1] = error_update
            else:
                updates.append(error_update)
            break

    update_message = {
        "status": "success",
        "updates": [update.model_dump(exclude_none=True) for update in updates],
    }

    if VERBOSE:
        d(update_message)

    return update_message
