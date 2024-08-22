from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .execution_wrapper import ExecutionWrapper
from .utils import find_and_load_classes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXECUTION_WRAPPER = ExecutionWrapper()
THUMBNAILS_ONLY = True

def get_classes_dict():
    '''Scans the nodes directory and loads all the classes'''
    
    return find_and_load_classes("backend/nodes")

CLASSES_DICT = get_classes_dict()
EXECUTION_WRAPPER.set_classes_dict(CLASSES_DICT)

def reload_nodes():
    '''Repopulates the classes_dict with the latest classes'''
    global CLASSES_DICT
    CLASSES_DICT = get_classes_dict()