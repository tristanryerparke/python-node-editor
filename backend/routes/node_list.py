from fastapi import APIRouter

from ..base_node import BaseNodeData
from ..config import EXECUTION_WRAPPER, reload_nodes

node_list_router = APIRouter()

@node_list_router.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""

    reload_nodes()

    nodes_dict = {}
    for key, value in EXECUTION_WRAPPER.classes_dict.items():
        category_list = []
        for node_class in value:
            instance: BaseNodeData = node_class(id='')
            category_list.append(instance.model_dump())
        nodes_dict[key] = category_list

    return nodes_dict