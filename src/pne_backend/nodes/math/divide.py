from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from functools import lru_cache
MAXSIZE = 10

class DivideNode(BaseNode):
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
                # data=IntData(payload=1),  # Ensure default is not zero to avoid division by zero
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
        if b.payload == 0:
            raise ValueError("Cannot divide by zero")
        result = a.payload / b.payload
        return FloatData(payload=result) 