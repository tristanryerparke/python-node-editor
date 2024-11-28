from functools import lru_cache
from typing import Tuple
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

MAXSIZE = 10


class SplitNode(BaseNode):
    group: str = 'Special'
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