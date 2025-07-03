from typing import Union
from ...base_node import BaseNode, node_definition, register_node
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from functools import lru_cache
MAXSIZE = 10

@register_node(namespace='Math', group='Basic')
class DivideNode(BaseNode):
    group: str = 'Basic'
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                user_label='A',
                allowed_types=['IntData', 'FloatData'],
                data=None
            ),
            InputNodeField(
                label='b', 
                allowed_types=['IntData', 'FloatData'],
                data=None
            )
        ],
        outputs=[
            OutputNodeField(label='result', allowed_types=['FloatData'])
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        if b.payload == 0:
            raise ValueError("Cannot divide by zero")
        result = a.payload / b.payload
        return FloatData(payload=result) 