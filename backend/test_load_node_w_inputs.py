from nodes.test_nodes import AddNode


node_json ='''
{
  "id": "0667889c-6e24-4b33-9123-e78b09ba970b",
  "name": "AddNode",
  "namespace": "test_nodes",
  "position": {
    "x": 0,
    "y": 0
  },
  "description": "",
  "inputs": {
    "a": {
      "type": "number",
      "default": 0,
      "value": 3
    },
    "b": {
      "type": "number",
      "default": 0,
      "value": 0
    }
  },
  "outputs": {
    "addition_result": null
  },
  "streaming": false
}
'''

node = AddNode.model_validate_json(node_json)

print(node.inputs)
print(node.outputs)
print(node.streaming)
