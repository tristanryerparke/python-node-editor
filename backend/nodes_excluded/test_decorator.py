# add backend to the system path
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.datatypes.field import NodeField
from backend.datatypes.base_node import BaseNode, node_definition



class AddNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='a', dtype='number', data=0),
            NodeField(label='b', dtype='number', data=0)
        ],
        outputs=[
            NodeField(label='result', dtype='number')
        ]
    )
    def exec(cls, a: float, b: float):
        return a + b

