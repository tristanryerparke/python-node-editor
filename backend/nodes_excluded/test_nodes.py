from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from backend.datatypes.base_node import BaseNode, StreamingBaseNode
from ..datatypes.field import NodeField

MAXSIZE = 10

DISPLAY_NAME = "Test"

class TestStreamingAddNode(StreamingBaseNode):
    description: str = "Test node for streaming that adds two numbers"
    @classmethod
    def exec_stream(
        cls,
        A: NodeField(field_type='input', label='A', dtype='number', data=0),
        B: NodeField(field_type='input', label='B', dtype='number', data=0)
    ) -> Generator[
        Dict[str, Union[str, int, float,
            NodeField(field_type='output', label='result', dtype='number'),
        ]],
        None,
        None
    ]:
        for i in range(5):
            # yield {'progress': i/5, 'outputs': [NodeField(field_type='output', label='result', dtype='number', data=i)]}
            yield {'progress': i/5}
            time.sleep(1)
            print(f'this status update came from inside the node: {i}')
        yield {'progress': 1, 'outputs': [NodeField(field_type='output', label='result', dtype='number', data=A.data + B.data)]}



class TestStreamingSplitNode(StreamingBaseNode):
    description: str = "Test node for streaming that splits a number into two numbers"

    @classmethod
    def exec_stream(
        cls,
        number: NodeField(field_type='input', label='Number', dtype='number', data=1),
        t: NodeField(field_type='input', label='T', dtype='number', data=0.5),
    ) -> Generator[
        Dict[str, Union[str, int, float, Tuple[
            NodeField(field_type='output', label='split_t', dtype='number'),
            NodeField(field_type='output', label='split_1_minus_t', dtype='number')
        ]]],
        None,
        None
    ]:
        if not 0 <= t.data <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            yield {
                'progress': i/5
                # 'outputs': [
                #     NodeField(field_type='output', label='split_t', dtype='number', data=i),
                #     NodeField(field_type='output', label='split_1_minus_t', dtype='number', data=i)
                # ]
            }

            time.sleep(1)

        yield {
            'progress': 1,
            'outputs': [
                NodeField(field_type='output', label='split_t', dtype='number', data=number.data * t.data),
                NodeField(field_type='output', label='split_1_minus_t', dtype='number', data=number.data * (1 - t.data))
            ]
        }