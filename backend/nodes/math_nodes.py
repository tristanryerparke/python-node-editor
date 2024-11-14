from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from ..datatypes.base_node import BaseNode, BaseNodeData, node_definition
from ..datatypes.field import InputNodeField, OutputNodeField
from ..datatypes.field_data import FieldData

MAXSIZE = 10

DISPLAY_NAME = "Math"

class AddNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='A', 
                dtype='number', 
                data=FieldData(payload=0, dtype='number'),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='B', 
                dtype='number', 
                data=FieldData(payload=0, dtype='number'),
                metadata={
                    'max': 100,
                    'min': -100
                }
            )
        ],
        outputs=[
            OutputNodeField(label='Result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, A: FieldData, B: FieldData) -> FieldData:
        result = A.payload + B.payload
        return FieldData(payload=result, dtype='number')
    
class ExponentNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='Base', 
                dtype='number', 
                data=FieldData(payload=2, dtype='number'),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='Exponent', 
                dtype='number', 
                data=FieldData(payload=2, dtype='number'),
                metadata={
                    'max': 10,  # Limiting exponent range to avoid extremely large numbers
                    'min': -10
                }
            )
        ],
        outputs=[
            OutputNodeField(label='Result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, Base: FieldData, Exponent: FieldData) -> FieldData:
        result = Base.payload ** Exponent.payload
        return FieldData(payload=result, dtype='number')

class AddNoDefaultNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number'),
            InputNodeField(label='b', dtype='number')
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: FieldData, b: FieldData) -> FieldData:
        result = a.payload + b.payload
        return FieldData(payload=result, dtype='number')

class SubtractNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FieldData(payload=0, dtype='number')),
            InputNodeField(label='b', dtype='number', data=FieldData(payload=0, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: FieldData, b: FieldData) -> FieldData:
        result = a.payload - b.payload
        return FieldData(payload=result, dtype='number')

class MultiplyNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FieldData(payload=0, dtype='number')),
            InputNodeField(label='b', dtype='number', data=FieldData(payload=1, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: FieldData, b: FieldData) -> FieldData:
        result = a.payload * b.payload
        return FieldData(payload=result, dtype='number')

class DivideNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FieldData(payload=1, dtype='number')),
            InputNodeField(label='b', dtype='number', data=FieldData(payload=1, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: FieldData, b: FieldData) -> FieldData:
        if b.payload == 0:
            raise ValueError("Cannot divide by zero")
        result = a.payload / b.payload
        return FieldData(payload=result, dtype='number')

class SplitNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='number', dtype='number', data=FieldData(payload=1, dtype='number')),
            InputNodeField(label='t', dtype='number', data=FieldData(payload=0.5, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='split_t', dtype='number'),
            OutputNodeField(label='split_1_minus_t', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, number: FieldData, t: FieldData) -> Tuple[FieldData, FieldData]:
        if not 0 <= t.payload <= 1:
            raise ValueError("t must be between 0 and 1")
        split_t = number * t
        split_1_minus_t = number * (1 - t)
        return [
            FieldData(payload=split_t, dtype='number'),
            FieldData(payload=split_1_minus_t, dtype='number')
        ]