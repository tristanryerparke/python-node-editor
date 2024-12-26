import os
import importlib
import inspect
import json

from pydantic import BaseModel, model_validator
from collections import deque

from .base_node import BaseNode, StreamingBaseNode


def find_and_load_classes(module_path: str):
    '''Finds all node classes in a given module path and loads them'''
    all_classes = {}

    spec = importlib.util.find_spec(module_path)
    if spec is None or not spec.submodule_search_locations:
        return all_classes

    for item in os.listdir(spec.submodule_search_locations[0]):
        category_module_path = f"{module_path}.{item}"
        
        # Skip if not a directory or if it's a __pycache__ folder
        if item.startswith('_') or not os.path.isdir(os.path.join(spec.submodule_search_locations[0], item)):
            continue

        try:
            category_module = importlib.import_module(category_module_path)
            display_name = getattr(category_module, 'DISPLAY_NAME', item)
            classes = []

            category_spec = importlib.util.find_spec(category_module_path)
            if category_spec and category_spec.submodule_search_locations:
                for filename in os.listdir(category_spec.submodule_search_locations[0]):
                    if not filename.endswith('.py') or filename.startswith('_'):
                        continue

                    module_name = filename[:-3]
                    module_full_path = f"{category_module_path}.{module_name}"

                    try:
                        importlib.invalidate_caches()
                        module = importlib.import_module(module_full_path)
                        importlib.reload(module)

                        for name, obj in inspect.getmembers(module):
                            # Find all node classes in the module
                            if (inspect.isclass(obj) and 
                                issubclass(obj, BaseNode) and 
                                obj not in (BaseNode, StreamingBaseNode)):
                                try:
                                    source_file = inspect.getsourcefile(obj)
                                    start_line = inspect.getsourcelines(obj)[1]
                                    obj.definition_path = f"{source_file}:{start_line}"
                                    classes.append(obj)
                                except (OSError, TypeError) as e:
                                    print(f"Error getting source file for {obj.__name__}: {e}")
                    except ModuleNotFoundError as e:
                        print(f"Error loading module {module_full_path}: {e}")
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