from functools import lru_cache
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

MAXSIZE = 10

class ReplaceNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='text', dtype='string', data=FieldData(payload='', dtype='string')),
            InputNodeField(label='old', dtype='string', data=FieldData(payload='', dtype='string')),
            InputNodeField(label='new', dtype='string', data=FieldData(payload='', dtype='string'))
        ],
        outputs=[
            OutputNodeField(label='replace_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, text: FieldData, old: FieldData, new: FieldData) -> FieldData:
        text_replaced = text.payload.replace(old.payload, new.payload)
        return FieldData(payload=text_replaced, dtype='string') 