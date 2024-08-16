from fastapi import FastAPI, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import inspect
from typing import get_type_hints, get_origin, Union, Dict
from utils import find_and_load_classes, topological_sort

from docarray import BaseDoc
from devtools import debug as d
from typing import List, Dict, Any, get_args


from base_node import BaseNode, StreamingBaseNode
from execution import execution_router
from node_list import node_list_router


def format_type(t):
    if get_origin(t) is Union and set(get_args(t)) == {float, int}:
        return 'float'
    elif t is float:
        return 'float'
    elif t is int:
        return 'int'
    else:
        raise Exception(f"Unknown type {t}")




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""
    classes = find_and_load_classes("nodes")
    nodes_dict = {}
    for key, value in classes.items():
        category_list = []
        for node_class in value:
            instance: BaseNode = node_class(id='')
            category_list.append(instance.model_dump())
    nodes_dict[key] = category_list

    return nodes_dict


@app.get("/status")
def get_status():
    new_items = None
    if wrapper.current_stream:
        new_items = wrapper.current_stream[wrapper.last_sent_index + 1:]
        wrapper.last_sent_index = len(wrapper.current_stream) - 1
    return {
        "current_node": wrapper.current_node,
        "stream": new_items,
        "nodes": wrapper.node_instances
    }

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execution_router)
app.include_router(node_list_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)