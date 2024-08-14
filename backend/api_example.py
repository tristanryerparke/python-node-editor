from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import inspect
from typing import get_type_hints, get_origin, Union, Dict
from utils import find_and_load_classes, topological_sort
from base_node import BaseNode, StreamingNode

def format_type(t):
    if t is Union[float, int]:
        return 'number'
    elif t is float:
        return 'float'
    elif t is int:
        return 'int'
    else:
        raise Exception(f"Unknown type {t}")

graph_def = {
    'nodes': {
        'mf1': {'type': 'TestStreamingAddNode', 'namespace': 'test_nodes', 'inputs': {'a': 5, 'b': 5}, 'outputs': {'addition_result': None}},
        'mf2': {'type': 'AddNode', 'namespace': 'test_nodes', 'inputs': {'a': 10, 'b': 10}, 'outputs': {'addition_result': None}},
        'mf3': {'type': 'SubtractNode', 'namespace': 'test_nodes', 'inputs': {'a': None, 'b': None}, 'outputs': {'addition_result': None}},
        'mf4': {'type': 'SplitNode', 'namespace': 'test_nodes', 'inputs': {'number': None, 't': 0.25}, 'outputs': {'split_t_result': None, 'split_1_minus_t_result': None}},
    },
    'edges': [
        {'from': {'id': 'mf1', 'port': 'addition_result'}, 'to': {'id': 'mf3', 'port': 'b'}},
        {'from': {'id': 'mf2', 'port': 'addition_result'}, 'to': {'id': 'mf3', 'port': 'a'}},
        {'from': {'id': 'mf3', 'port': 'subtraction_result'}, 'to': {'id': 'mf4', 'port': 'number'}},
    ]
}

# graph_def = {
#     'nodes': {
#         'mf1' : {'type': 'LoadImageFile', 'namespace': 'image_nodes', 'inputs': {'image_path': 'New Project.png'}, 'outputs': {'image': None}},
#         'mf2' : {'type': 'BlurImage', 'namespace': 'image_nodes', 'inputs': {'image': None, 'radius': 5}, 'outputs': {'image': None}},
#         'mf3' : {'type': 'SaveImage', 'namespace': 'image_nodes', 'inputs': {'image': None, 'image_path': 'New Project_blur.png'}, 'outputs': {'image_path': None}},
#     },
#     'edges': [
#         {'from': {'id': 'mf1', 'port': 'image'}, 'to': {'id': 'mf2', 'port': 'image'}},
#         {'from': {'id': 'mf2', 'port': 'image'}, 'to': {'id': 'mf3', 'port': 'image'}},
#     ]
# }

# with open('graph.json', 'w') as f:
#     f.write(json.dumps(graph_def))


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ExecutionWrapper:
    def __init__(self):
        self.current_node = None
        self.current_stream = []
        self.last_sent_index = -1
        self.node_instances = {}  # Initialize an empty dictionary to hold node instances

    def execute_graph(self, graph_def, classes_dict):
        # Instantiate all nodes first and populate self.node_instances
        self.node_instances = {}
        for id, node in graph_def['nodes'].items():
            node_type = node['type']
            namespace = node['namespace']
            NodeClass = next((cls for cls in classes_dict.get(namespace, []) if cls.__name__ == node_type), None)
            if NodeClass:
                instance = NodeClass(id=id)
                self.node_instances[id] = instance
                self.node_instances[id].inputs = node['inputs']
                self.node_instances[id].outputs = node['outputs']
        
        # Execute nodes based on sorted order
        sorted_nodes = topological_sort(graph_def)
        for node_id in sorted_nodes:
            self.current_node = node_id
            node_instance = self.node_instances[node_id]
            print(f"Server: Currently executing node {node_id}")

            if hasattr(node_instance, 'streaming'):
                for item in node_instance.meta_exec():
                    self.current_stream.append(item)
                    if item['status'] == 'progress':
                        print(f"Server: Streaming item {item['value']}")
                    elif item['status'] == 'complete':
                        print(f"Server: Node {node_id} completed with result {item['value']}")
                        # Generator nodes have a dict output for progress flagging, so we need to extract the value when the node is complete
                        for key, value in item['value'].items():
                            node_instance.outputs[key] = value
            else:
                node_instance.meta_exec()
                print(f"Server: Node {node_id} completed with result {node_instance.outputs}")

            # Populate the inputs of the next node through the edges
            for edge in graph_def['edges']:
                if edge['from']['id'] == node_id:
                    to_node_id = edge['to']['id']
                    to_port = edge['to']['port']
                    from_port = edge['from']['port']
                    self.node_instances[to_node_id].inputs[to_port] = node_instance.outputs[from_port]

        self.current_node = None
        self.current_stream = []

wrapper = ExecutionWrapper()

@app.get("/execute")
def execute(background_tasks: BackgroundTasks):
    directory = "nodes"
    classes_dict = find_and_load_classes(directory)
    background_tasks.add_task(wrapper.execute_graph, graph_def, classes_dict)
    return {"message": "Execution started"}

@app.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""
    classes = find_and_load_classes("nodes")
    nodes_dict = {}
    for key, value in classes.items():
        category_list = []
        for node_class in value:
            # analyze and convert the nodes params to a sendable json format
            print('Node: ', node_class)

            # determine whether the node uses streaming or not
            if node_class.__bases__[0] == StreamingNode:
                streaming = True
                execfunc = node_class.exec_stream.__func__
                print('Streaming node')

                signature = inspect.signature(execfunc)
                type_hints = get_type_hints(execfunc)

                input_types = {k: format_type(v) for k, v in type_hints.items() if k in signature.parameters}
                print('Input types: ', input_types)

                # extract output types
                output_types = type_hints.get('return')
                
                # print('output types: ', output_types.__args__[0])
                inside_generator_type = output_types.__args__[0]

                print('raw output types: ', inside_generator_type)

                if get_origin(inside_generator_type) == tuple:
                    
                    print('Multiple outputs:')
                    for t in inside_generator_type.__args__:
                        print('t: ', t)
                        
                else:
                    print('Single output: ')
                    print('t: ', inside_generator_type.__args__[1])




                # types_list = [format_type(t.__args__[1]) for t in types_list]


                # out_names_types = {n: t for n, t in zip(node_class().outputs.keys(), types_list)}
                # print('Output types: ', out_names_types)

            else:
                streaming = False
                execfunc = node_class.exec.__func__
                print('Non-streaming node')

                signature = inspect.signature(execfunc)
                type_hints = get_type_hints(execfunc)

                input_types = {k: format_type(v) for k, v in type_hints.items() if k in signature.parameters}
                print('Input types: ', input_types)

                # extract output types
                output_types = type_hints.get('return')
                



                if get_origin(output_types) == tuple:
                    types_list = output_types.__args__
                    print('Multiple outputs')
                else:
                    types_list = [output_types]

                # select the second type in the tuple (the first is the dict)
                types_list = [format_type(t.__args__[1]) for t in types_list]

                # create the name: type dict
                out_names_types = {n: t for n, t in zip(node_class().outputs.keys(), types_list)}
                print('Output types: ', out_names_types)

            print()

            # create the node dict
            category_list.append({
                'name': node_class.__name__,
                # 'description': node_class.__doc__,
                # 'inputs': input_types,
                # 'outputs': out_names_types,
                'streaming': streaming,
            })

        nodes_dict[key] = category_list
            
    return nodes_dict


@app.get("/status")
def get_status():
    new_items = None
    if wrapper.current_stream:
        new_items = wrapper.current_stream[wrapper.last_sent_index + 1:]
        wrapper.last_sent_index = len(wrapper.current_stream) - 1
    return {
        "current_node": wrapper.current_node,
        "stream": new_items,
        "nodes": wrapper.node_instances
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)
