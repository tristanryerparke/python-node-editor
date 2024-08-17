import os
import importlib
import inspect
from base_node import BaseNode, StreamingBaseNode
from collections import deque


def find_and_load_classes(directory):
    # List to store the classes
    all_classes = {}
    
    # Iterate through the files in the directory
    for filename in os.listdir(directory):
        print(filename)
        
        if filename.endswith('.py'):
            module_name = filename[:-3]
            module = importlib.import_module(f"{directory}.{filename[:-3]}")
            
            # Get a list of classes defined in the module
            classes = [obj for name, obj in inspect.getmembers(module) if inspect.isclass(obj) and issubclass(obj, BaseNode) if obj != BaseNode and obj != StreamingBaseNode]
            
            # Add the definition_path attribute to each class
            for obj in classes:
                source_file = inspect.getsourcefile(obj)
                source_lines, start_line = inspect.getsourcelines(obj)
                definition_path = f"{source_file}:{start_line}"
                obj.definition_path = definition_path
            
            # Add to the list of all classes
            all_classes[module_name] = classes

    print(all_classes)
            
    return all_classes

def topological_sort(graph_def):
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