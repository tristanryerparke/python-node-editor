import time
import json
from utils import topological_sort, find_and_load_classes
from docarray import BaseDoc
from base_node import BaseNode, NodeInput


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

    def execute_graph(self, graph_def: GraphDef, classes_dict):
        start_time = time.time()
        self.node_instances = {}
        
        print(f"Starting graph execution... {len(graph_def.nodes)} nodes, {len(graph_def.edges)} edges")
        
        # Node instantiation
        node_instantiation_start = time.time()
        for node in graph_def.nodes:
            id = str(node['id'])
            node_type = node['name']
            namespace = node['namespace']
            NodeClass = next((cls for cls in classes_dict.get(namespace, []) if cls.__name__ == node_type), None)
            if NodeClass:
                from base_node import NodeInput, BaseNode

                with open('node.json', 'w') as f:
                    json.dump(node, f, indent=2)

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

            if node_instance.streaming:
                for item in node_instance.meta_exec():
                    self.current_stream.append(item)
                    if item['status'] == 'progress':
                        print(f"Server: Streaming item {item['value']}")
                    elif item['status'] == 'complete':
                        print(f"Server: Node {node_id} completed with result {item['value']}")
                        for key, value in item['value'].items():
                            node_instance.outputs[key] = value
            else:
                node_instance.meta_exec()

            node_end = time.time()
            print(f"Node {node_id} execution took {node_end - node_start:.4f} seconds")
            print(f"Node {node_id} completed with result:\n{json.dumps(node_instance.outputs, indent=2)}")

                    # Edge processing
            for edge in graph_def.edges:
                if edge['source'] in sorted_nodes:
                    to_node_id = edge['target']
                    from_port = edge['sourceHandle'].split('-')[-1]
                    to_port = edge['targetHandle'].split('-')[-1]
                    self.node_instances[to_node_id].inputs[to_port].value = self.node_instances[edge['source']].outputs[from_port]
                    print(f"Edge processing: {edge['source']}:{from_port} -> {edge['target']}:{to_port}")


        execution_end = time.time()
        print(f"Total node execution took {execution_end - execution_start:.4f} seconds")



        self.current_node = None
        self.current_stream = []

        end_time = time.time()
        total_time = end_time - start_time
        print(f"Total graph execution took {total_time:.4f} seconds")