from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.base_node import BaseNode, BaseNodeData
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Math"

class AddNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        A: NodeField(field_type='input', label='A', dtype='number', data=0),
        B: NodeField(field_type='input', label='B', dtype='number', data=0)
    ) -> NodeField(field_type='output', label='Result', dtype='number'):
        a: float = A.data
        b: float = B.data

        return NodeField(field_type='output', label='Result', dtype='number', data=a + b)

class AddNoDefaultNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        A: NodeField(field_type='input', label='a', dtype='number'),
        B: NodeField(field_type='input', label='b', dtype='number')
    ) -> NodeField(field_type='output', label='result', dtype='number'):
        a: float = A.data
        b: float = B.data
        return NodeField(field_type='output', label='result', dtype='number', data=a + b)

class SubtractNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeField(field_type='input', label='a', dtype='number', data=0),
        b: NodeField(field_type='input', label='b', dtype='number', data=0)
    ) -> NodeField(field_type='output', label='result', dtype='number'):
        return NodeField(field_type='output', label='result', dtype='number', data=a.data - b.data)

class MultiplyNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeField(field_type='input', label='a', dtype='number', data=1),
        b: NodeField(field_type='input', label='b', dtype='number', data=1)
    ) -> NodeField(field_type='output', label='result', dtype='number'):
        return NodeField(field_type='output', label='result', dtype='number', data=a.data * b.data)

class DivideNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: NodeField(field_type='input', label='a', dtype='number', data=1),
        b: NodeField(field_type='input', label='b', dtype='number', data=1)
    ) -> NodeField(field_type='output', label='result', dtype='number'):
        if b.data == 0:
            raise ValueError("Cannot divide by zero")
        return NodeField(field_type='output', label='result', dtype='number', data=a.data / b.data)

class SplitNode(BaseNode):
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        number: NodeField(field_type='input', label='number', dtype='number', data=1),
        t: NodeField(field_type='input', label='t', dtype='number', data=0.5)
    ) -> Tuple[
        NodeField(field_type='output', label='split_t', dtype='number'),
        NodeField(field_type='output', label='split_1_minus_t', dtype='number')
    ]:
        t: float = t.data
        number: float = number.data 


        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return (
            NodeField(field_type='output', label='split_t', dtype='number', data=number * t),
            NodeField(field_type='output', label='split_1_minus_t', dtype='number', data=number * (1 - t))
        )