from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from classes import NodeInput, NodeOutput
from base_node import BaseNode, BaseNodeData

MAXSIZE = 10


DISPLAY_NAME = "Math"
    

class AddNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', value=0),
        b: NodeInput(label='b', type='number', value=0)
    ) -> NodeOutput(label='result', type='number'):
        return NodeOutput(label='result', type='number', value=a + b)
    

class AddNodeNoDefault(BaseNode):
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number'),
        b: NodeInput(label='b', type='number', value=0)
    ) -> NodeOutput(label='result', type='number'):
        return NodeOutput(label='result', type='number', value=a + b)
    

class SubtractNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', value=0),
        b: NodeInput(label='b', type='number', value=0)
    ) -> NodeOutput(label='result', type='number'):
        return NodeOutput(label='result', type='number', value=a - b)
    

class MultiplyNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', value=1),
        b: NodeInput(label='b', type='number', value=1)
    ) -> NodeOutput(label='result', type='number'):
        print(f'Multiplying {a} and {b} to get {a * b}')
        return NodeOutput(label='result', type='number', value=a * b)

class DivideNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeInput(label='a', type='number', value=1),
        b: NodeInput(label='b', type='number', value=1)
    ) -> NodeOutput(label='result', type='number'):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return NodeOutput(label='result', type='number', value=a / b)


class SplitNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        number: NodeInput(label='number', type='number', value=1),
        t: NodeInput(label='t', type='number', value=0.5)
    ) -> Tuple[NodeOutput(label='split_t', type='number'), NodeOutput(label='split_1_minus_t', type='number')]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return (NodeOutput(label='split_t', type='number', value=number * t),
                NodeOutput(label='split_1_minus_t', type='number', value=number * (1 - t)))