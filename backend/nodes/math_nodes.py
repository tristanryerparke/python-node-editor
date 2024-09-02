from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.base_node import BaseNode, BaseNodeData, node_definition
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Math"

class AddNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='A', dtype='number', data=0),
            NodeField(label='B', dtype='number', data=0)
        ],
        outputs=[
            NodeField(label='Result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, A: float, B: float):
        return A + B

class AddNoDefaultNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='a', dtype='number'),
            NodeField(label='b', dtype='number')
        ],
        outputs=[
            NodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: float, b: float):
        return a + b

class SubtractNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='a', dtype='number', data=0),
            NodeField(label='b', dtype='number', data=0)
        ],
        outputs=[
            NodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: float, b: float):
        return a - b

class MultiplyNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='a', dtype='number', data=1),
            NodeField(label='b', dtype='number', data=1)
        ],
        outputs=[
            NodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: float, b: float):
        return a * b

class DivideNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='a', dtype='number', data=1),
            NodeField(label='b', dtype='number', data=1)
        ],
        outputs=[
            NodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: float, b: float):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

class SplitNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(label='number', dtype='number', data=1),
            NodeField(label='t', dtype='number', data=0.5)
        ],
        outputs=[
            NodeField(label='split_t', dtype='number'),
            NodeField(label='split_1_minus_t', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, number: float, t: float) -> Tuple[float, float]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return number * t, number * (1 - t)