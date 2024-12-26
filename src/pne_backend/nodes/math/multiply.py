from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

MAXSIZE = 10

class MultiplyNode(BaseNode):
    group: str = 'Basic'
    
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FloatData(payload=0)),
            InputNodeField(label='b', dtype='number', data=FloatData(payload=1))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        if isinstance(a, IntData) and isinstance(b, IntData):
            result = a.payload * b.payload
            return IntData(payload=result)
        else:
            result = a.payload * b.payload
            return FloatData(payload=result) 