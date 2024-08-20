from functools import lru_cache
from typing import Dict, List, Union
from base_node import BaseNode, BaseNodeData, NodeOutput

MAXSIZE = 10

DISPLAY_NAME = "Text"

class ReplaceNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'replace_result': NodeOutput(type='str')
        },
        description = "Replace a string with another string"
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        text: str = "",
        old: str = "",
        new: str = "",
    ) -> Dict[str, str]:
        return {'replace_result': text.replace(old, new)}

class JoinNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'join_result': NodeOutput(type='str')
        },
        description = "Join two strings with a separator"
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        separator: str = "",
        a: str = "",
        b: str = "",
    ) -> Dict[str, str]:
        return {'join_result': separator.join([a, b])}

class SplitTextNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'split_result': NodeOutput(type='list')
        }
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        text: str = "",
        separator: str = " ",
    ) -> Dict[str, List[str]]:
        return {'split_result': text.split(separator)}