from fastapi import APIRouter

from base_node import BaseNode
from utils import find_and_load_classes

from shared_globals import CLASSES_DICT

node_list_router = APIRouter()

@node_list_router.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""
    global CLASSES_DICT
    nodes_dict = {}
    for key, value in CLASSES_DICT.items():
        category_list = []
        for node_class in value:
            instance: BaseNode = node_class(id='')
            category_list.append(instance.model_dump())
        nodes_dict[key] = category_list

    return nodes_dict
