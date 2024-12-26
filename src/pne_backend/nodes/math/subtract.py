from typing import Union
# from functools import lru_cache
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

MAXSIZE = 10

class SubtractNode(BaseNode):
    group: str = 'Basic'
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FloatData(payload=0)),
            InputNodeField(label='b', dtype='number', data=FloatData(payload=0))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    # @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        # if both are ints, return an int
        if isinstance(a, IntData) and isinstance(b, IntData):
            result = a.payload - b.payload
            return IntData(payload=result)
        else:
            result = a.payload - b.payload
            return FloatData(payload=result) 
