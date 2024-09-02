import time
import json
import traceback
# import cProfile
from pydantic import BaseModel

from .datatypes.base_node import BaseNode, StreamingBaseNode
from .utils import topological_sort
from fastapi import WebSocket
import asyncio
from devtools import debug as d

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
        # profiler = cProfile.Profile()
        # profiler.enable()
        start_time = time.time()
        self.node_instances = {}

        # d(graph_def)
        graph_def = GraphDef.model_validate(graph_def)
        
        print(f"Starting graph execution... {len(graph_def.nodes)} nodes, {len(graph_def.edges)} edges")
        
        # Node instantiation
        node_instantiation_start = time.time()
        for node in graph_def.nodes:
            id = str(node['id'])

            # Set data to None for connected inputs
            for edge in graph_def.edges:
                if edge['target'] == id:
                    target_handle = edge['targetHandle'].split('-')[-1]
                    if 'data' in node and 'inputs' in node['data']:
                        for input in node['data']['inputs']:
                            if input['label'] == target_handle:
                                input['data'] = None

            node_type = node['data']['class_name']
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
            print(f"Executing node {node_id} ({node_instance.data.display_name})...")
            
            # clear the node's outputs
            for o in node_instance.data.outputs:
                o.data = None

            node_instance.data.status = 'streaming' if node_instance.data.streaming else 'executing'

            # send a status update
            await self.send_update({"event": "node_data_update", "node_id": node_id, "updates": {
                "status": node_instance.data.status,
                "terminal_output": node_instance.data.terminal_output,
                "error_output": node_instance.data.error_output,
            }})

            # Allow other tasks to run
            await asyncio.sleep(0)

            try:
                if node_instance.data.streaming:
                    node_instance: StreamingBaseNode
                    node_instance.data.terminal_output = ''
                    node_instance.data.error_output = ''

                    for item in node_instance.meta_exec():
                        await self.send_update({"event": "full_node_update", "node": node_instance.model_dump_json()})
                        await asyncio.sleep(0)

                else:
                    node_instance.meta_exec()

                node_end = time.time()
                print(f"Node {node_id} completed. Execution took {node_end - node_start:.4f} seconds")
                # print(f"Node {node_id} completed with result:\n{node_instance.data.outputs}")
                
                node_instance.data.status = 'evaluated'

            # capture any errors
            except Exception as e:
                node_instance.data.status = 'error'
                node_instance.data.error_output = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
                print(f"Error executing node {node_id}: {str(e)}")
                print(f"Traceback:\n{traceback.format_exc()}")

            # send a full update
            await self.send_update({"event": "full_node_update", "node": node_instance.model_dump_json()})
            
            # allow other tasks to run
            await asyncio.sleep(0)

            # edge processing
            for edge in graph_def.edges:
                if edge['source'] == node_id:
                    to_node_id = edge['target']
                    from_port = edge['sourceHandle'].split('-')[-1]
                    to_port = edge['targetHandle'].split('-')[-1]
                    
                    source_output_field = next((output for output in self.node_instances[edge['source']].data.outputs if output.label == from_port), None)
                    target_input_field = next((input for input in self.node_instances[to_node_id].data.inputs if input.label == to_port), None)
                    
                    if source_output_field and target_input_field:
                        target_input_field.data = source_output_field.data
                        print(f"Edge processing: {edge['source']}({self.node_instances[edge['source']].data.display_name}):{from_port} -> {edge['target']}({self.node_instances[edge['target']].data.display_name}):{to_port}")
                    else:
                        print(f"Warning: Could not find matching ports for edge {edge['source']}:{from_port} -> {edge['target']}:{to_port}")

        execution_end = time.time()
        print(f"Total node execution took {execution_end - execution_start:.4f} seconds")

        await self.send_update({"event": "execution_finished"})

        self.current_node = None
        self.current_stream = []

        end_time = time.time()
        total_time = end_time - start_time
        print(f"Total graph execution took {total_time:.4f} seconds")

        if self.websocket:
            await self.websocket.close()
            self.websocket = None

        # profiler.disable()
        # profiler.dump_stats("execution_profile.pstat")