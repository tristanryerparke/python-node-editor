from utils import find_and_load_classes
from execution_wrapper import ExecutionWrapper

CLASSES_DICT = find_and_load_classes("nodes")

EXECUTION_WRAPPER = ExecutionWrapper()

def reload_nodes():
    global CLASSES_DICT, EXECUTION_WRAPPER
    CLASSES_DICT = find_and_load_classes("nodes")