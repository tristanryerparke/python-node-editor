from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.fields import NodeInput, NodeOutput
from ..datatypes.base_node import BaseNode, BaseNodeData
from ..datatypes.field_data import Data


DISPLAY_NAME = "Primitives"

class NumberNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=10)
    def exec(
        cls,
        value: NodeInput(label='Value', type='number', input_data=Data(dtype='json', data=0)),
    ) -> NodeOutput(label='Result', type='number'):
        return NodeOutput(label='Result', type='number', output_data=Data(dtype='json', data=value))
    

class StringNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=10)
    def exec(
        cls,
        value: NodeInput(label='Value', type='string')) -> NodeOutput(label='Result', type='string'):
        return NodeOutput(label='Result', type='string', output_data=Data(dtype='json', data=value))
    
class ImageNode(BaseNode):
    @classmethod
    def exec(
        cls,
        value: NodeInput(label='Value', type='image')) -> NodeOutput(label='Result', type='image'):
        return NodeOutput(label='Result', type='image', output_data=Data(dtype='image', data=value))
    
    
