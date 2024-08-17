import time
import json
import traceback
from utils import topological_sort, find_and_load_classes
from docarray import BaseDoc
from base_node import BaseNode, NodeInput, NodeOutput
from fastapi import WebSocket
import asyncio
from devtools import debug as d

class GraphDef(BaseDoc):
    nodes: list
    edges: list

class ExecuteRequest(BaseDoc):
    graph_def: GraphDef

class ExecutionWrapper:
    def __init__(self):
        self.current_node = None
        self.current_stream = []
        self.last_sent_index = -1
        self.node_instances = {}
        self.websocket: WebSocket | None = None

    def set_websocket(self, websocket: WebSocket | None):
        self.websocket = websocket

    async def send_update(self, message: dict):
        if self.websocket:
            await self.websocket.send_json(message)
        else:
            print(f"Websocket not set, cannot send message: {message}")

    async def execute_graph(self, graph_def: GraphDef, classes_dict):
        start_time = time.time()
        self.node_instances = {}


        graph_def = GraphDef.model_validate(graph_def)
        
        print(f"Starting graph execution... {len(graph_def.nodes)} nodes, {len(graph_def.edges)} edges")
        
        # Node instantiation
        node_instantiation_start = time.time()
        for node in graph_def.nodes:
            id = str(node['id'])
            node_type = node['name']
            namespace = node['namespace']
            NodeClass = next((cls for cls in classes_dict.get(namespace, []) if cls.__name__ == node_type), None)
            if NodeClass:
                instance = NodeClass.model_validate(node)
                self.node_instances[id] = instance
        node_instantiation_end = time.time()
        print(f"Node instantiation took {node_instantiation_end - node_instantiation_start:.4f} seconds")

        # Topological sort
        sort_start = time.time()
        sorted_nodes = topological_sort(graph_def.dict())
        sort_end = time.time()
        print(f"Topological sort took {sort_end - sort_start:.4f} seconds")

        # Node execution
        execution_start = time.time()
        for node_id in sorted_nodes:
            node_start = time.time()
            self.current_node = node_id
            node_instance: BaseNode = self.node_instances[str(node_id)]
            print(f"Executing node {node_id} ({node_instance.name})...")
            
            node_instance.status = 'streaming' if node_instance.streaming else 'executing'
            await self.send_update({"status": "node_update", "node": node_instance.model_dump()})
            
            # Allow other tasks to run
            await asyncio.sleep(0)

            try:
                if node_instance.streaming:
                    for item in node_instance.meta_exec():
                        self.current_stream.append(item)
                        print(f"Server: Streaming item {item}")
                        if item.get('status') == 'progress':
                            print(f"Server: Streaming item {item}")
                            for key, value in item.items():
                                if key != 'status':
                                    node_instance.outputs[key].value = value
                            await self.send_update({"status": "node_update", "node": node_instance.model_dump()})
                            await asyncio.sleep(0)
                        elif item.get('status') == 'complete':
                            print(f"Server: Node {node_id} completed with result {item}")
                            for key, value in item.items():
                                if key != 'status':
                                    node_instance.outputs[key].value = value
                else:
                    node_instance.meta_exec()

                node_end = time.time()
                print(f"Node {node_id} execution took {node_end - node_start:.4f} seconds")
                print(f"Node {node_id} completed with result:\n{node_instance.outputs}")
                
                node_instance.status = 'evaluated'
            except Exception as e:
                node_instance.status = 'error'
                node_instance.error_output = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
                print(f"Error executing node {node_id}: {str(e)}")
                print(f"Traceback:\n{traceback.format_exc()}")

            d(node_instance)
            await self.send_update({"status": "node_update", "node": node_instance.model_dump()})
            
            # Allow other tasks to run
            await asyncio.sleep(0)

            if node_instance.status == 'error':
                print(f"Stopping execution due to error in node {node_id}")
                break

            # Edge processing
            for edge in graph_def.edges:
                if edge['source'] == node_id:
                    to_node_id = edge['target']
                    from_port = edge['sourceHandle'].split('-')[-1]
                    to_port = edge['targetHandle'].split('-')[-1]
                    self.node_instances[to_node_id].inputs[to_port].value = self.node_instances[edge['source']].outputs[from_port].value
                    print(f"Edge processing: {edge['source']}:{from_port} -> {edge['target']}:{to_port}")

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