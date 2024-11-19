import os
import io
import importlib
import inspect
import json
import base64
import reprlib
import traceback


from collections import deque
from typing import Any
import numpy as np
from PIL import Image

from backend.datatypes.base_node import BaseNode, StreamingBaseNode


def find_and_load_classes(directory: str):
    '''finds all node classes in a given directory and loads them'''
    all_classes = {}

    # Iterate through directories (categories) in the nodes folder
    for item in os.listdir(directory):
        category_path = os.path.join(directory, item)
        
        # Skip if not a directory or if it's a __pycache__ folder
        if not os.path.isdir(category_path) or item.startswith('__'):
            continue

        try:
            # Import the category's __init__.py to get the display name
            category_module = importlib.import_module(f"backend.nodes.{item}")
            display_name = getattr(category_module, 'DISPLAY_NAME', item)
            classes = []

            # Iterate through all python files in the category folder
            for filename in os.listdir(category_path):
                if not filename.endswith('.py') or filename.startswith('__'):
                    continue

                module_name = filename[:-3]
                module_path = f"backend.nodes.{item}.{module_name}"

                try:
                    importlib.invalidate_caches()
                    module = importlib.import_module(module_path)
                    importlib.reload(module)

                    # Find all node classes in the module
                    for name, obj in inspect.getmembers(module):
                        if (inspect.isclass(obj) and 
                            issubclass(obj, BaseNode) and 
                            obj != BaseNode and 
                            obj != StreamingBaseNode):
                            try:
                                source_file = inspect.getsourcefile(obj)
                                start_line = inspect.getsourcelines(obj)[1]
                                obj.definition_path = f"{source_file}:{start_line}"
                                classes.append(obj)
                            except (OSError, TypeError) as e:
                                print(f"Error getting source file for {obj.__name__}: {e}")
                                continue

                except ModuleNotFoundError:
                    print(f"Error loading module {module_path}")
                    continue

            if classes:  # Only add categories that have nodes
                all_classes[display_name] = classes

        except ModuleNotFoundError:
            print(f"Error loading category {item}")
            continue

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


def autosave(graph_def: dict):
    filename = graph_def['metadata']['filename']
    with open(f'autosave/{filename}_autosave.json', 'w') as f:
        json.dump(graph_def, f)