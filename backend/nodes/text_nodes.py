from functools import lru_cache
from typing import Tuple
from ..datatypes.base_node import BaseNode, node_definition
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Text"

class ReplaceNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(field_type='input', label='text', dtype='string', data=""),
            NodeField(field_type='input', label='old', dtype='string', data=""),
            NodeField(field_type='input', label='new', dtype='string', data="")
        ],
        outputs=[
            NodeField(field_type='output', label='replace_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, text: str, old: str, new: str) -> str:
        return text.replace(old, new)

class JoinNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(field_type='input', label='separator', dtype='string', data=""),
            NodeField(field_type='input', label='a', dtype='string', data=""),
            NodeField(field_type='input', label='b', dtype='string', data="")
        ],
        outputs=[
            NodeField(field_type='output', label='join_result', dtype='string')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, separator: str, a: str, b: str) -> str:
        return separator.join([a, b])