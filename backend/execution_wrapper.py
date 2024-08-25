import time
import json
import traceback
from pydantic import BaseModel
from .utils import topological_sort
from .base_node import BaseNode, NodeInput, NodeOutput
from fastapi import WebSocket
import asyncio
from devtools import debug as d

def json_analyze_outputs(json_string: str):
    output_0 = json.loads(json_string)['data']['outputs'][0]['output_data']
    if output_0:
        output_components = output_0.items()
        print(f"output_0 components:")
        for value, component in output_components:
            print(f'{value}: {len(component)}')
    else:
        print(f'output_0 had type {type(output_0)}')

class GraphDef(BaseModel):
    nodes: list
    edges: list

class ExecuteRequest(BaseModel):
    graph_def: GraphDef

class ExecutionWrapper:
    def __init__(self):
        self.current_node = None
        self.current_stream = []
        self.last_sent_index = -1
        self.node_instances = {}
        self.websocket: WebSocket | None = None
        self.classes_dict = None

    def set_websocket(self, websocket: WebSocket | None):
        self.websocket = websocket

    def set_classes_dict(self, classes_dict):
        self.classes_dict = classes_dict

    async def send_update(self, message: dict):
        if self.websocket:
            await self.websocket.send_json(message)
        else:
            print(f"Websocket not set, cannot send message: {message}")

    async def execute_graph(self, graph_def: GraphDef):
        start_time = time.time()
        self.node_instances = {}

        # d(graph_def)
        graph_def = GraphDef.model_validate(graph_def)
        
        print(f"Starting graph execution... {len(graph_def.nodes)} nodes, {len(graph_def.edges)} edges")
        
        # Node instantiation
        node_instantiation_start = time.time()
        for node in graph_def.nodes:
            id = str(node['id'])
            # print(f"Instantiating node {id}...")
            node_type = node['data']['name']
            namespace = node['data']['namespace']
            NodeClass = next((cls for cls in self.classes_dict.get(namespace, []) if cls.__name__ == node_type), None)
            if NodeClass:
                instance = NodeClass.model_validate(node)
                self.node_instances[id] = instance
        node_instantiation_end = time.time()
        print(f"Node instantiation took {node_instantiation_end - node_instantiation_start:.4f} seconds")

        # d(self.node_instances)

        # Topological sort
        sort_start = time.time()
        sorted_nodes = topological_sort(graph_def.model_dump())
        sort_end = time.time()
        print(f"Topological sort took {sort_end - sort_start:.4f} seconds")

        # Node execution
        execution_start = time.time()
        for node_id in sorted_nodes:
            node_start = time.time()
            self.current_node = node_id
            node_instance: BaseNode = self.node_instances[str(node_id)]
            print(f"Executing node {node_id} ({node_instance.data.name})...")
            
            exclude_object = {'data': {
                'inputs': {'__all__': {'input_data': {'image_array'}}},
                'outputs': {'__all__': {'output_data': {'image_array'}}}
            }}

            # print('BEFORE EXECUTION:')
            # print('INPUTS:')
            # d(node_instance.data.inputs)
            # print('OUTPUTS:')
            # d(node_instance.data.outputs)

            # print('pause')
            # for i in node_instance.data.inputs:
            #     d(i)
            # print('OUTPUTS:')
            # for o in node_instance.data.outputs:
            #     d(o)

            # clear the node's outputs
            for o in node_instance.data.outputs:
                o.output_data = None

            

            node_instance.data.status = 'streaming' if node_instance.data.streaming else 'executing'
            await self.send_update({"status": "node_update", "node": node_instance.model_dump_json(exclude=exclude_object)})
            
            # Allow other tasks to run
            await asyncio.sleep(0)


            try:
                if node_instance.data.streaming:
                    for item in node_instance.meta_exec():
                        self.current_stream.append(item)
                        print(f"Server: Streaming item {item}")
                        if item.get('status') == 'progress':
                            print(f"Server: Streaming item {item}")
                            for key, value in item.items():
                                if key != 'status':
                                    node_instance.data.outputs[key].output_data = value
                            await self.send_update({"status": "node_update", "node": node_instance.model_dump_json(exclude=exclude_object)})
                            await asyncio.sleep(0)
                        elif item.get('status') == 'complete':
                            print(f"Server: Node {node_id} completed with result {item}")
                            for key, value in item.items():
                                if key != 'status':
                                    node_instance.data.outputs[key].output_data = value
                else:
                    node_instance.meta_exec()

                node_end = time.time()
                print(f"Node {node_id} completed. Execution took {node_end - node_start:.4f} seconds")
                # print(f"Node {node_id} completed with result:\n{node_instance.data.outputs}")
                
                node_instance.data.status = 'evaluated'

            # Capture and send any errors
            except Exception as e:
                node_instance.data.status = 'error'
                node_instance.data.error_output = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
                print(f"Error executing node {node_id}: {str(e)}")
                print(f"Traceback:\n{traceback.format_exc()}")

            # print(json_analyze_outputs(node_instance.model_dump_json(exclude=exclude_object)))

            # print('hi')

            # print('BEFORE EXECUTION:')
            # print('INPUTS:')
            # d(node_instance.data.inputs)
            # print('OUTPUTS:')
            # d(node_instance.data.outputs)

            # print('pause')

            await self.send_update({"status": "node_update", "node": node_instance.model_dump_json(exclude=exclude_object)})
            
            # Allow other tasks to run
            await asyncio.sleep(0)

            # Stop execution if node has errored
            # if node_instance.data.status == 'error':
            #     print(f"Stopping execution due to error in node {node_id}")
            #     break

            # d(graph_def.edges)

            # Edge processing
            for edge in graph_def.edges:
                if edge['source'] == node_id:
                    to_node_id = edge['target']
                    from_port = edge['sourceHandle'].split('-')[-1]
                    to_port = edge['targetHandle'].split('-')[-1]
                    
                    source_output = next((output for output in self.node_instances[edge['source']].data.outputs if output.label == from_port), None)
                    target_input = next((input for input in self.node_instances[to_node_id].data.inputs if input.label == to_port), None)
                    
                    if source_output and target_input:
                        target_input.input_data = source_output.output_data
                        print(f"Edge processing: {edge['source']}({self.node_instances[edge['source']].data.name}):{from_port} -> {edge['target']}({self.node_instances[edge['target']].data.name}):{to_port}")
                    else:
                        print(f"Warning: Could not find matching ports for edge {edge['source']}:{from_port} -> {edge['target']}:{to_port}")

        execution_end = time.time()
        print(f"Total node execution took {execution_end - execution_start:.4f} seconds")

        await self.send_update({"status": "finished"})

        self.current_node = None
        self.current_stream = []

        end_time = time.time()
        total_time = end_time - start_time
        print(f"Total graph execution took {total_time:.4f} seconds")

        if self.websocket:
            await self.websocket.close()
            self.websocket = None