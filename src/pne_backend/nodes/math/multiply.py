from typing import Union
from ...base_node import BaseNode, node_definition, register_node
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from functools import lru_cache
MAXSIZE = 10

@register_node(namespace='Math', group='Basic')
class MultiplyNode(BaseNode):
    
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                user_label='A',
                allowed_types=['IntData', 'FloatData'],
                data=IntData(payload=1),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='b', 
                allowed_types=['IntData', 'FloatData'],
                data=IntData(payload=2),
                metadata={
                    'max': 100,
                    'min': -100
                }
            )
        ],
        outputs=[
            OutputNodeField(label='result', allowed_types=['IntData', 'FloatData'])
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