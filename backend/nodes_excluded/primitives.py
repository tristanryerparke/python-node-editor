from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.field import NodeField
from ..datatypes.base_node import BaseNode, BaseNodeData
from ..datatypes.field import Data


DISPLAY_NAME = "Primitives"

class NumberNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=10)
    def exec(
        cls,
        value: NodeField(field_type='input', label='Value', dtype='json', data=0),
    ) -> NodeField(field_type='output', label='Result', dtype='json', data=value):
        return NodeField(field_type='output', label='Result', dtype='json', data=value)
    

# class StringNode(BaseNode):
#     @classmethod
#     @lru_cache(maxsize=10)
#     def exec(
#         cls,
#         value: NodeInput(label='Value', type='string')) -> NodeOutput(label='Result', type='string'):
#         return NodeOutput(label='Result', type='string', output_data=Data(dtype='json', data=value))
    
# class ImageNode(BaseNode):
#     @classmethod
#     def exec(
#         cls,
#         value: NodeInput(label='Value', type='image')) -> NodeOutput(label='Result', type='image'):
#         return NodeOutput(label='Result', type='image', output_data=Data(dtype='image', data=value))
    
    
