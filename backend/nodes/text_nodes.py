from functools import lru_cache
from typing import Tuple
from ..datatypes.base_node import BaseNode
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Text"

class ReplaceNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        text: NodeField(field_type='input', label='text', dtype='string', data=""),
        old: NodeField(field_type='input', label='old', dtype='string', data=""),
        new: NodeField(field_type='input', label='new', dtype='string', data="")
    ) -> NodeField(field_type='output', label='replace_result', dtype='string'):
        return NodeField(field_type='output', label='replace_result', dtype='string', data=text.data.replace(old.data, new.data))

class JoinNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        separator: NodeField(field_type='input', label='separator', dtype='string', data=""),
        a: NodeField(field_type='input', label='a', dtype='string', data=""),
        b: NodeField(field_type='input', label='b', dtype='string', data="")
    ) -> NodeField(field_type='output', label='join_result', dtype='string'):
        return NodeField(field_type='output', label='join_result', dtype='string', data=separator.data.join([a.data, b.data]))