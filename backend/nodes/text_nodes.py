from functools import lru_cache
from typing import Tuple
from ..datatypes.base_node import BaseNode, node_definition
from ..datatypes.field import InputNodeField, OutputNodeField
from ..datatypes.field_data import FieldData

MAXSIZE = 10

DISPLAY_NAME = "Text"

class ReplaceNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='text', dtype='string'),
            InputNodeField(field_type='input', label='old', dtype='string'),
            InputNodeField(field_type='input', label='new', dtype='string')
        ],
        outputs=[
            OutputNodeField(field_type='output', label='replace_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, text: FieldData, old: FieldData, new: FieldData) -> FieldData:
        text_replaced = text.payload.replace(old.payload, new.payload)
        return FieldData(payload=text_replaced, dtype='string')

class JoinNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='separator', dtype='string'),
            InputNodeField(field_type='input', label='a', dtype='string'),
            InputNodeField(field_type='input', label='b', dtype='string')
        ],
        outputs=[
            OutputNodeField(field_type='output', label='join_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, separator: FieldData, a: FieldData, b: FieldData) -> FieldData:
        join_result = separator.payload.join([a.payload, b.payload])
        return FieldData(payload=join_result, dtype='string')