import os
import io
import importlib
import inspect
import json
import base64
import reprlib


from collections import deque
from typing import Any
import numpy as np
from PIL import Image

from backend.datatypes.base_node import BaseNode, StreamingBaseNode


def find_and_load_classes(directory: str):
    '''finds all node classes in a given directory and loads them'''
    # List to store the classes
    all_classes = {}

    # Iterate through the files in the directory
    for filename in os.listdir(directory):
        print(filename)

        if filename.endswith('.py'):
            module_name = filename[:-3]
            module = importlib.import_module(f"backend.nodes.{module_name}")

            # Get a list of classes defined in the module
            classes = [obj for name, obj in inspect.getmembers(module) if inspect.isclass(
                obj) and issubclass(obj, BaseNode) and obj != BaseNode and obj != StreamingBaseNode]

            # Add the definition_path attribute to each class
            for obj in classes:
                source_file = inspect.getsourcefile(obj)
                start_line = inspect.getsourcelines(obj)[1]
                definition_path = f"{source_file}:{start_line}"
                obj.definition_path = definition_path

            # Use the module's custom display name if available, otherwise use the module name
            display_name = getattr(module, 'DISPLAY_NAME', module_name)

            # Add to the list of all classes
            all_classes[display_name] = classes

    print(all_classes)

    return all_classes


def topological_sort(graph_def: dict):
    '''performs a topological sort on a graph definition of nodes and edges'''
    in_degree = {}
    graph = {}
    nodes = graph_def['nodes']

    for node in nodes:
        in_degree[node['id']] = 0
        graph[node['id']] = []

    for edge in graph_def['edges']:
        from_node = edge['source']
        to_node = edge['target']
        graph[from_node].append(to_node)
        in_degree[to_node] += 1

    queue = deque()
    for node in nodes:
        if in_degree[node['id']] == 0:
            queue.append(node['id'])

    sorted_nodes = []
    while queue:
        node = queue.popleft()
        sorted_nodes.append(node)

        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return sorted_nodes