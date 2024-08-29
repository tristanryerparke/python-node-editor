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


def db_str_serialize(dtype: str, data: Any):
    '''serializes data for storage in redis'''

    if dtype == 'json':
        return json.dumps(data)

    elif dtype == 'numpy' or dtype == 'image':
        return json.dumps(data.tolist())

    elif dtype == 'basemodel':
        return data.model_dump_json()

    else:
        raise TypeError('unsupported dtype for db storage')


def db_str_deserialize(cls, dtype: str, data: str):
    '''deserializes data that came from redis'''
    if dtype == 'json':
        return json.loads(data)

    elif dtype == 'numpy' or dtype == 'image':
        return np.array(json.loads(data))

    elif dtype == 'basemodel':
        class_dict = json.loads(data)
        class_name = class_dict.get('class_name')
        if class_name in cls.class_options:
            return cls.class_options[class_name].model_validate(class_dict)
        else:
            raise ValueError(
                f"Class name {class_name} not found in class options")

    else:
        raise TypeError('unsupported dtype for db deserialization')


def image_to_base64(img: np.ndarray) -> str:
    '''converts a numpy array to a base64 encoded string'''
    img = Image.fromarray(img)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')


def base64_to_image(base64_str: str) -> np.ndarray:
    '''converts a base64 encoded string to a numpy array'''
    img_data = base64.b64decode(base64_str)
    return np.array(Image.open(io.BytesIO(img_data)))


def prep_data_for_frontend_serialization(dtype: str, data: Any) -> str:
    '''catches and converts non-serializable small data types before sending to frontend'''
    if dtype == 'json':
        return data  # json doesn't need preprocessing

    elif dtype == 'numpy':
        return data.tolist()  # convert numpy array to list

    elif dtype == 'image':
        return image_to_base64(data)

    elif dtype == 'basemodel':
        return data.model_dump()

    else:
        raise TypeError('unsupported dtype for frontend serialization')


def prep_data_for_frontend_deserialization(dtype: str, data: Any) -> Any:
    '''re-instantiates non-serializable data types when receiving small data from frontend'''
    if dtype == 'json':
        return data  # json doesn't need preprocessing

    elif dtype == 'numpy':
        # if the data is already a numpy array, return it, this happens when creating a class
        if isinstance(data, np.ndarray):
            return data
        else:
            return np.array(data)  # convert list to numpy array

    elif dtype == 'image':
        if isinstance(data, np.ndarray):
            return data
        else:
            return base64_to_image(data)

    elif dtype == 'basemodel':
        return data

    else:
        raise TypeError('unsupported dtype for frontend deserialization')


def truncate_repr(obj):
    '''truncates the repr of large objects to keep the data payload small'''
    r = reprlib.Repr()
    r.maxstring = 50  # max characters for strings
    r.maxother = 50   # max characters for other repr
    return r.repr(obj).strip("'")

def create_thumbnail(data, max_file_size_mb):
    img = Image.fromarray(data).convert("RGB")
    max_pixels = int((max_file_size_mb * 1024 * 1024) / 3)  # 3 bytes per pixel for RGB
    max_side = int(np.sqrt(max_pixels))
    img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image_to_base64(np.array(img))

def get_string_size_mb(s: str) -> float:
    return len(s.encode('utf-8')) / (1024 * 1024)