import time
import json
import traceback
import cProfile
from pydantic import BaseModel

from .base_node import BaseNode, StreamingBaseNode
from .utils import topological_sort, autosave
from fastapi import WebSocket
import asyncio
from devtools import debug as d

class ExecutionCancelled(Exception):
    pass

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
        self.node_classes = None
        self.cancel_flag = False

    def set_websocket(self, websocket: WebSocket | None):
        self.websocket = websocket

    def set_node_classes(self, node_classes):
        self.node_classes = node_classes

    async def send_update(self, message: dict):
        if self.websocket:
            await self.websocket.send_json(message)
        else:
            print(f"Websocket not set, cannot send message: {message}")

    async def execute_graph(self, graph_def: dict, quiet: bool = False, headless: bool = False):
        # Simplified version - ignoring quiet and headless parameters
        
        # autosave(graph_def)
        
        print("quiet", quiet)
        updated_nodes = []

        async def check_cancel_flag():
            await asyncio.sleep(0)
            if self.cancel_flag:
                raise ExecutionCancelled("Execution was cancelled")


        # profiler = cProfile.Profile()
        # profiler.enable()
        start_time = time.time()
        self.node_instances = {}

        # d(graph_def)
        graph_def = GraphDef.model_validate(graph_def)
        
        print(f"Starting graph execution... {len(graph_def.nodes)} nodes, {len(graph_def.edges)} edges")
        
        await check_cancel_flag()
        # Node instantiation
        node_instantiation_start = time.time()
        for node in graph_def.nodes:
            id = str(node['id'])

            # Set data to None for connected inputs
            for edge in graph_def.edges:
                if edge['target'] == id:
                    target_handle_parts = edge['targetHandle'].split(':')
                    target_handle = target_handle_parts[2] if len(target_handle_parts) >= 3 else target_handle_parts[-1]
                    if 'data' in node and 'inputs' in node['data']:
                        for input in node['data']['inputs']:
                            if input['label'] == target_handle or str(input.get('index', '')) == target_handle:
                                input['data'] = None

            # Set outputs to None
            if 'data' in node and 'outputs' in node['data']:
                for output in node['data']['outputs']:
                    output['data'] = None

            node_type = node['data']['class_name']
            namespace = node['data']['namespace']
            NodeClass = next((node_info['class'] for node_info in self.node_classes.get(namespace, []) if node_info['class'].__name__ == node_type), None)
            if NodeClass:
                instance = NodeClass.model_validate(node, context={'state': 'deserializing'})
                self.node_instances[id] = instance
        node_instantiation_end = time.time()
        print(f"Node instantiation took {node_instantiation_end - node_instantiation_start:.4f} seconds")

        # d(self.node_instances)

        # Topological sort
        sort_start = time.time()
        sorted_nodes = topological_sort(graph_def.model_dump())
        sort_end = time.time()
        print(f"Topological sort took {sort_end - sort_start:.4f} seconds")

        await check_cancel_flag()

        
        # Node execution
        execution_start = time.time()
        
        # Send initial status update for all nodes
        status_updates = [
            {"node_id": node_id, "status": "pending"} 
            for node_id in sorted_nodes
        ]
        await self.send_update({
            "event": "status_update",
            "updates": status_updates
        })
        
        await self.send_update({"event": "execution_started"})
        
        for node_id in sorted_nodes:
            node_instance: BaseNode = self.node_instances[str(node_id)]
            
            # Update status to executing
            node_instance.data.status = 'streaming' if node_instance.data.streaming else 'executing'
            await self.send_update({
                "event": "status_update",
                "updates": [{"node_id": node_id, "status": node_instance.data.status}]
            })
            
            # Clear outputs
            for o in node_instance.data.outputs:
                o.data = None
            
            try:
                # Execute node
                if node_instance.data.streaming:
                    # Streaming node handling...
                    pass
                else:
                    node_instance.meta_exec()
                
                # Update status to evaluated and send ONE final node update
                node_instance.data.status = 'evaluated'
                await self.send_update({
                    "event": "single_node_update",
                    "node": node_instance.model_dump_json()
                })
                
            except Exception as e:
                node_instance.data.status = 'error'
                node_instance.data.error_output = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
                await self.send_update({
                    "event": "status_update",
                    "updates": [{"node_id": node_id, "status": "error"}]
                })
                print(f"Error executing node {node_id}: {str(e)}")
                print(f"Traceback:\n{traceback.format_exc()}")
            
            # Edge processing...
            for edge in graph_def.edges:
                if edge['source'] == node_id:
                    source_node = self.node_instances[str(edge['source'])]
                    target_node = self.node_instances[str(edge['target'])]
                    
                    # Extract indices from the new handle format
                    source_handle_parts = edge['sourceHandle'].split(':')
                    target_handle_parts = edge['targetHandle'].split(':')
                    
                    # The index is now the third part in the handle ID
                    source_index = source_handle_parts[2] if len(source_handle_parts) >= 3 else source_handle_parts[-1]
                    target_index = target_handle_parts[2] if len(target_handle_parts) >= 3 else target_handle_parts[-1]
                    
                    # Find the corresponding output and input
                    source_output = next((o for i, o in enumerate(source_node.data.outputs) 
                                         if str(i) == source_index or o.label == source_index), None)
                    target_input = next((i for j, i in enumerate(target_node.data.inputs) 
                                        if str(j) == target_index or i.label == target_index), None)
                    
                    if source_output and target_input:
                        # Transfer data from source output to target input
                        target_input.data = source_output.data
        
        execution_end = time.time()
        print(f"Total node execution took {execution_end - execution_start:.4f} seconds")


        self.current_node = None
        self.current_stream = []

        end_time = time.time()
        total_time = end_time - start_time
        print(f"Total graph execution took {total_time:.4f} seconds")

        # if not quiet and not headless:
        #     await self.send_update({"event": "full_graph_update", "all_nodes": updated_nodes})

        if self.websocket:
            await self.websocket.send_json({"event": "execution_finished"})
            await self.websocket.close()
            self.websocket = None



        # profiler.disable()
        # profiler.dump_stats("execution_profile.pstat")

        return updated_nodes