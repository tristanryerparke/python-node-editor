from utils import find_and_load_classes, topological_sort
import copy
import time

graph_def = {
    'nodes': {
        'mf1': {'type': 'AddNode', 'namespace': 'test_nodes', 'inputs': {'a': 5, 'b': 5}, 'outputs': {'addition_result': None}},
        'mf2': {'type': 'AddNode', 'namespace': 'test_nodes', 'inputs': {'a': 10, 'b': 10}, 'outputs': {'addition_result': None}},
        'mf3': {'type': 'TestStreamingAddNode', 'namespace': 'test_nodes', 'inputs': {'a': None, 'b': None}, 'outputs': {'addition_result': None}},
    },
    'edges': [
        {'from': {'id': 'mf1', 'port': 'addition_result'}, 'to': {'id': 'mf3', 'port': 'a'}},
        {'from': {'id': 'mf2', 'port': 'addition_result'}, 'to': {'id': 'mf3', 'port': 'b'}}
    ]
}

def build_and_execute_graph(graph_def, classes_dict):
    # Step 1: Topological sort to find execution order
    sorted_nodes = topological_sort(graph_def)
    
    # Step 2: Create node instances
    node_instances = {}
    for id, node in graph_def['nodes'].items():
        node_type = node['type']
        namespace = node['namespace']
        
        NodeClass = next((cls for cls in classes_dict.get(namespace, []) if cls.__name__ == node_type), None)
        if NodeClass:
            instance = NodeClass(id=id)
            node_instances[id] = instance
            node_instances[id].inputs = node['inputs']
            node_instances[id].outputs = node['outputs']

    for node_id in sorted_nodes:
        # execute the node
        node_instance = node_instances[node_id]
        if hasattr(node_instance, 'streaming'):
            print(f'streaming progress from node: {node_instance.id}')
            for stream_item in node_instance.meta_exec():
                print(stream_item)
        else:
            node_instance.meta_exec()

        # populate the inputs of the next node through the edges
        for edge in graph_def['edges']:
            if edge['from']['id'] == node_id:
                to_node_id = edge['to']['id']
                to_port = edge['to']['port']
                from_port = edge['from']['port']
                node_instances[to_node_id].inputs[to_port] = node_instance.outputs[from_port]
                
    print("final result:")
    print(node_instances[node_id])

if __name__ == "__main__":
    directory = "nodes"
    classes_dict = find_and_load_classes(directory)

    build_and_execute_graph(graph_def, classes_dict)
