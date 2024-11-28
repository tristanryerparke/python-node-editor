from functools import lru_cache
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

MAXSIZE = 10

class AddNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='A', 
                dtype='number', 
                data=FieldData(payload=0, dtype='number'),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='B', 
                dtype='number', 
                data=FieldData(payload=0, dtype='number'),
                metadata={
                    'max': 100,
                    'min': -100
                }
            )
        ],
        outputs=[
            OutputNodeField(label='Result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, A: FieldData, B: FieldData) -> FieldData:
        result = A.payload + B.payload
        return FieldData(payload=result, dtype='number') 