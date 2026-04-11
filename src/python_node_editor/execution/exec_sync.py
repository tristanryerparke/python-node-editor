import shortuuid
from devtools import debug as d
from fastapi import APIRouter

from python_node_editor.execution.exec_utils import (
    VERBOSE,
    create_node_update,
    execute_node,
    propagate_node_outputs,
    topological_order,
)
from python_node_editor.schema import Graph

router = APIRouter(prefix="/api")


@router.post("/graph_execute")
async def execute_graph_sync(graph: Graph):
    """Execute a graph containing nodes and edges synchronously"""

    execution_id = shortuuid.uuid()
    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")
        success, result, terminal_output = execute_node(
            node.data, node_id=node.id, execution_id=execution_id
        )

        node_update = create_node_update(
            node, success, result, terminal_output, graph, execution_list
        )

        updates.append(node_update)
        updates.extend(
            propagate_node_outputs(node, node_update, graph, execution_list)
        )

    update_message = {
        "status": "success",
        "updates": [update.model_dump(exclude_none=True) for update in updates],
    }

    if VERBOSE:
        d(update_message)

    return update_message
