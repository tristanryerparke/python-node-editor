from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from functools import lru_cache
MAXSIZE = 10

class AddNode(BaseNode):
    group: str = 'Basic'
    min_width: int = 140
    max_width: int = 400

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                user_label='A',
                allowed_types=['IntData', 'FloatData'],
                data=IntData(payload=1),
            ),
            InputNodeField(
                label='b', 
                allowed_types=['IntData', 'FloatData'],
                data=IntData(payload=2),
            )
        ],
        outputs=[
            OutputNodeField(label='result', allowed_types=['IntData', 'FloatData'])
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: Union[IntData, FloatData], b: Union[IntData, FloatData]) -> FloatData:
        if isinstance(a, IntData) and isinstance(b, IntData):
            result = a.payload + b.payload
            return IntData(payload=result)
        else:
            result = a.payload + b.payload
            return FloatData(payload=result) 