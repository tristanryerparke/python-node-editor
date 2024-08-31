from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.fields import NodeInput, NodeOutput
from ..datatypes.base_node import BaseNode, BaseNodeData
from ..datatypes.field_data import Data

MAXSIZE = 10


DISPLAY_NAME = "Math"
    

class AddNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        A: NodeInput(label='A', type='number', input_data=Data(dtype='json', data=0)),
        B: NodeInput(label='B', type='number', input_data=Data(dtype='json', data=0))
    ) -> NodeOutput(label='Result', type='number'):
        return NodeOutput(label='Result', type='number', output_data=Data(dtype='json', data=A + B))
    

class AddNodeNoDefault(BaseNode):
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number'),
        b: NodeInput(label='b', type='number')
    ) -> NodeOutput(label='result', type='number'):
        return NodeOutput(label='result', type='number', output_data=Data(dtype='json', data=a + b))
    

class SubtractNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', input_data=Data(dtype='json', data=0)),
        b: NodeInput(label='b', type='number', input_data=Data(dtype='json', data=0))
    ) -> NodeOutput(label='result', type='number'):
        return NodeOutput(label='result', type='number', output_data=Data(dtype='json', data=a - b))
    

class MultiplyNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', input_data=Data(dtype='json', data=1)),
        b: NodeInput(label='b', type='number', input_data=Data(dtype='json', data=1))
    ) -> NodeOutput(label='result', type='number'):
        print(f'Multiplying {a} and {b} to get {a * b}')
        return NodeOutput(label='result', type='number', output_data=Data(dtype='json', data=a * b))

class DivideNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', input_data=Data(dtype='json', data=1)),
        b: NodeInput(label='b', type='number', input_data=Data(dtype='json', data=1))
    ) -> NodeOutput(label='result', type='number'):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return NodeOutput(label='result', type='number', output_data=a / b)


class SplitNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        number: NodeInput(label='number', type='number', input_data=Data(dtype='json', data=1)),
        t: NodeInput(label='t', type='number', input_data=Data(dtype='json', data=0.5))
    ) -> Tuple[NodeOutput(label='split_t', type='number'), NodeOutput(label='split_1_minus_t', type='number')]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return (NodeOutput(label='split_t', type='number', output_data=Data(dtype='json', data=number * t)),
                NodeOutput(label='split_1_minus_t', type='number', output_data=Data(dtype='json', data=number * (1 - t))))