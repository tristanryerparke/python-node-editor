from functools import lru_cache
from typing import Tuple
from base_node import BaseNode
from classes import NodeInput, NodeOutput

MAXSIZE = 10

DISPLAY_NAME = "Text"

class ReplaceNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        text: NodeInput(label='text', type='string', value=""),
        old: NodeInput(label='old', type='string', value=""),
        new: NodeInput(label='new', type='string', value="")
    ) -> NodeOutput(label='replace_result', type='string'):
        return NodeOutput(label='replace_result', type='string', value=text.replace(old, new))

class JoinNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        separator: NodeInput(label='separator', type='string', value=""),
        a: NodeInput(label='a', type='string', value=""),
        b: NodeInput(label='b', type='string', value="")
    ) -> NodeOutput(label='join_result', type='string'):
        return NodeOutput(label='join_result', type='string', value=separator.join([a, b]))

class SplitTextNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        text: NodeInput(label='text', type='string', value=""),
        separator: NodeInput(label='separator', type='string', value=" ")
    ) -> Tuple[NodeOutput(label='split_result', type='number'), NodeOutput(label='split_result', type='number')]:
        return (NodeOutput(label='split_result', type='number', value=len(text.split(separator))),
                NodeOutput(label='split_result', type='number', value=text.split(separator)))