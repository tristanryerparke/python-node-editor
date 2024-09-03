from typing import Tuple, Union, Dict, Generator, List
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from backend.datatypes.base_node import BaseNode, StreamingBaseNode, node_definition
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Test"

class TestStreamingAddNode(StreamingBaseNode):
    description: str = "Test node for streaming that adds two numbers"
    @classmethod
    @node_definition(
        inputs=[
            NodeField(field_type='input', label='a', dtype='number', data=0),
            NodeField(field_type='input', label='b', dtype='number', data=0)
        ],
        outputs=[
            NodeField(field_type='output', label='result', dtype='number')
        ]
    )
    def exec_stream(
        cls,
        a: float,
        b: float
    ) -> Generator[
        Dict[str, Union[str, int, float, List[NodeField]]],
        None,
        None
    ]:
        for i in range(10):
            # yield {'progress': i/5, 'outputs': [NodeField(field_type='output', label='result', dtype='number', data=i)]}
            yield {'progress': i/10, 'outputs': [i]}
            time.sleep(1)
            print(f'this status update came from inside the node: {i}')
        yield {'progress': 1, 'outputs': [a + b]}

class TestStreamingSplitNode(StreamingBaseNode):
    description: str = "Test node for streaming that splits a number into two numbers"
    @classmethod
    @node_definition(
        inputs=[
            NodeField(field_type='input', label='number', dtype='number', data=1),
            NodeField(field_type='input', label='t', dtype='number', data=0.5)
        ],
        outputs=[
            NodeField(field_type='output', label='split_t', dtype='number'),
            NodeField(field_type='output', label='split_1_minus_t', dtype='number')
        ]
    )
    def exec_stream(
        cls,
        number: float,
        t: float
    ) -> Generator[
        Dict[str, Union[str, int, float, List[NodeField]]],
        None,
        None
    ]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            print(f'this status update came from inside the node: {i}')
            yield {'progress': i/5}
            time.sleep(1)

        yield {
            'progress': 1,
            'outputs': [
                number * t,
                number * (1 - t)
            ]
        }