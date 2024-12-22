from functools import lru_cache
from typing import Tuple, Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

MAXSIZE = 10


class SplitNode(BaseNode):
    group: str = 'Special'
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='number', dtype='number', data=FloatData(payload=1.0)),
            InputNodeField(label='t', dtype='number', data=FloatData(payload=0.5))
        ],
        outputs=[
            OutputNodeField(label='split_t', dtype='number'),
            OutputNodeField(label='split_1_minus_t', dtype='number')
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, number: Union[IntData, FloatData], t: FloatData) -> Tuple[FloatData, FloatData]:
        if not 0 <= t.payload <= 1:
            raise ValueError("t must be between 0 and 1")
        split_t = number.payload * t.payload
        split_1_minus_t = number.payload * (1 - t.payload)
        return [
            FloatData(payload=split_t),
            FloatData(payload=split_1_minus_t)
        ]