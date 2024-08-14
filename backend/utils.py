import os
import importlib
import inspect
from base_node import BaseNode, StreamingNode
from collections import deque


def find_and_load_classes(directory):
    # List to store the classes
    all_classes = {}
    
    # Iterate through the files in the directory
    for filename in os.listdir(directory):
        
        if filename.endswith('.py'):
            module_name = filename[:-3]
            module = importlib.import_module(f"{directory}.{filename[:-3]}")
            
            # Get a list of classes defined in the module
            classes = [obj for name, obj in inspect.getmembers(module) if inspect.isclass(obj) and issubclass(obj, BaseNode) if obj != BaseNode and obj != StreamingNode]            
            # Add to the list of all classes
            all_classes[module_name] = classes
            
    return all_classes

def topological_sort(graph_def):
    in_degree = {}  # Count of incoming edges for each node
    graph = {}  # Outgoing edges for each node
    nodes = list(graph_def['nodes'].keys())

    # Initialize in_degree and graph
    for node in nodes:
        in_degree[node] = 0
        graph[node] = []

    # Build the graph and in_degree count
    for edge in graph_def['edges']:
        from_node = edge['from']['id']
        to_node = edge['to']['id']
        graph[from_node].append(to_node)
        in_degree[to_node] += 1

    # Initialize queue and add nodes with in_degree of 0
    queue = deque()
    for node in nodes:
        if in_degree[node] == 0:
            queue.append(node)

    # Perform topological sort
    sorted_nodes = []
    while queue:
        node = queue.popleft()
        sorted_nodes.append(node)

        # Reduce in_degree for all neighbors and check for 0
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return sorted_nodes