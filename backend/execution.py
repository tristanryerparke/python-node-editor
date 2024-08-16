import json
from utils import topological_sort, find_and_load_classes
from fastapi import APIRouter, Body, BackgroundTasks
from docarray import BaseDoc

from base_node import BaseNode, NodeInput
from execution_wrapper import ExecutionWrapper, ExecuteRequest

from shared_globals import CLASSES_DICT, EXECUTION_WRAPPER


execution_router = APIRouter()



@execution_router.post("/execute")
def execute(request: ExecuteRequest = Body(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    global CLASSES_DICT
    background_tasks.add_task(EXECUTION_WRAPPER.execute_graph, request.graph_def, CLASSES_DICT)