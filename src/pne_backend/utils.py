import os
import importlib
import inspect
import json

from pydantic import BaseModel, model_validator
from collections import deque

from .base_node import BaseNode, StreamingBaseNode, NODE_REGISTRY, NodeInfo, register_node, node_definition
from .field import InputNodeField, OutputNodeField
from .base_data import DATA_CLASS_REGISTRY


def get_registered_nodes():
    '''Returns all registered node classes from the NODE_REGISTRY with their group information'''
    result = {}
    for namespace, node_infos in NODE_REGISTRY.items():
        result[namespace] = []
        for node_info in node_infos:
            result[namespace].append({
                'class': node_info.cls,
                'group': node_info.group
            })
    return result


def get_registered_nodes_by_namespace_and_group():
    '''Returns nodes organized by namespace and then by group'''
    result = {}
    for namespace, node_infos in NODE_REGISTRY.items():
        result[namespace] = {}
        for node_info in node_infos:
            group = node_info.group
            if group not in result[namespace]:
                result[namespace][group] = []
            result[namespace][group].append(node_info.cls)
    return result


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


def create_auto_nodes(data_class):
    """Create Construct and Deconstruct nodes for a data class with auto_node=True"""
    
    # Get namespace and group from the class, with defaults
    namespace = getattr(data_class, 'auto_node_namespace', 'AutoNodes')
    group = getattr(data_class, 'auto_node_group', 'Basic')
    
    # Get fields from the model class
    fields = list(data_class.__annotations__.items())
    
    # Create Construct Node
    construct_inputs = [
        InputNodeField(label=field, allowed_types=[typ.__name__])
        for field, typ in fields
    ]
    construct_outputs = [OutputNodeField(label=data_class.__name__.lower())]
    
    @register_node(namespace=namespace, group=group)
    class ConstructNode(BaseNode):
        @classmethod
        @node_definition(inputs=construct_inputs, outputs=construct_outputs)
        def exec(cls, **kwargs):
            return data_class(**kwargs)
    
    ConstructNode.__name__ = f"Construct{data_class.__name__}Node"
    ConstructNode.__qualname__ = f"Construct{data_class.__name__}Node"
    ConstructNode.__module__ = data_class.__module__
    ConstructNode.__doc__ = f"Creates a {data_class.__name__} from its component fields"

    # Create Deconstruct Node  
    deconstruct_inputs = [InputNodeField(label=data_class.__name__.lower(), allowed_types=[data_class.__name__])]
    deconstruct_outputs = [OutputNodeField(label=field, allowed_types=[typ.__name__]) for field, typ in fields]
    
    @register_node(namespace=namespace, group=group)
    class DeconstructNode(BaseNode):
        @classmethod
        @node_definition(inputs=deconstruct_inputs, outputs=deconstruct_outputs)
        def exec(cls, **kwargs):
            obj = kwargs[data_class.__name__.lower()]
            return cls(**obj)
        
    
    DeconstructNode.__name__ = f"Deconstruct{data_class.__name__}Node"
    DeconstructNode.__qualname__ = f"Deconstruct{data_class.__name__}Node"
    DeconstructNode.__module__ = data_class.__module__
    DeconstructNode.__doc__ = f"Deconstructs a {data_class.__name__} into its component fields"

    return ConstructNode, DeconstructNode


def import_all_nodes(node_modules: list[str]):
    """Import all nodes including both regular and auto-generated ones"""
    # Import extensions to register nodes
    for module_path in node_modules:
        importlib.import_module(module_path)

    AUTO_NODE_REGISTRY = {}

    # Setup auto nodes for data classes
    for data_class in DATA_CLASS_REGISTRY.values():
        if hasattr(data_class, 'auto_node') and data_class.auto_node:
            construct_node, deconstruct_node = create_auto_nodes(data_class)
            
            # Ensure the namespace key exists
            if data_class.auto_node_namespace not in AUTO_NODE_REGISTRY:
                AUTO_NODE_REGISTRY[data_class.auto_node_namespace] = []
            
            # Remove existing nodes with the same name if they exist
            AUTO_NODE_REGISTRY[data_class.auto_node_namespace] = [
                node for node in AUTO_NODE_REGISTRY[data_class.auto_node_namespace] 
                if node['class'].__name__ not in [construct_node.__name__, deconstruct_node.__name__]
            ]
            
            # Add new nodes in the same format as get_registered_nodes()
            AUTO_NODE_REGISTRY[data_class.auto_node_namespace].append({
                'class': construct_node,
                'group': data_class.auto_node_group
            })
            AUTO_NODE_REGISTRY[data_class.auto_node_namespace].append({
                'class': deconstruct_node,
                'group': data_class.auto_node_group
            })
        
    # Update node classes with auto-generated nodes
    node_classes = get_registered_nodes()
    node_classes.update(AUTO_NODE_REGISTRY)

    return node_classes