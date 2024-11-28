from functools import lru_cache
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

MAXSIZE = 10

class SubtractNode(BaseNode):
    group: str = 'Basic'
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FieldData(payload=0, dtype='number')),
            InputNodeField(label='b', dtype='number', data=FieldData(payload=0, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: FieldData, b: FieldData) -> FieldData:
        result = a.payload - b.payload
        return FieldData(payload=result, dtype='number') 