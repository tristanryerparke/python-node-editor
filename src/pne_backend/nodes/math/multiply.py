from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from functools import lru_cache
MAXSIZE = 10

class MultiplyNode(BaseNode):
    group: str = 'Basic'
    
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                user_label='A',
                allowed_types=['IntData', 'FloatData'],
                default_generator_type='IntData',
                data=IntData(payload=1),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='b', 
                allowed_types=['IntData', 'FloatData'],
                default_generator_type='IntData',
                data=IntData(payload=2),
                metadata={
                    'max': 100,
                    'min': -100
                }
            )
        ],
        outputs=[
            OutputNodeField(label='result')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        if isinstance(a, IntData) and isinstance(b, IntData):
            result = a.payload * b.payload
            return IntData(payload=result)
        else:
            result = a.payload * b.payload
            return FloatData(payload=result) 