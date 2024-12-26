from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

MAXSIZE = 10

class DivideNode(BaseNode):
    group: str = 'Basic'
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FloatData(payload=0.0)),
            InputNodeField(label='b', dtype='number', data=FloatData(payload=1.0))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        if b.payload == 0:
            raise ValueError("Cannot divide by zero")
        result = a.payload / b.payload
        return FloatData(payload=result) 