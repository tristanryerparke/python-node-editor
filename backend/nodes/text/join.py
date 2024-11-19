from functools import lru_cache
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

MAXSIZE = 10

class JoinNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='separator', dtype='string', data=FieldData(payload='', dtype='string')),
            InputNodeField(label='a', dtype='string', data=FieldData(payload='', dtype='string')),
            InputNodeField(label='b', dtype='string', data=FieldData(payload='', dtype='string'))
        ],
        outputs=[
            OutputNodeField(label='join_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, separator: FieldData, a: FieldData, b: FieldData) -> FieldData:
        join_result = separator.payload.join([a.payload, b.payload])
        return FieldData(payload=join_result, dtype='string') 