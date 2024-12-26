import time
from typing import Dict, Union, List, Generator
from ...base_node import StreamingBaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

class TestStreamingSplitNode(StreamingBaseNode):
    description: str = "Test node for streaming that splits a number into two numbers"
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
    def exec_stream(
        cls,
        number: Union[IntData, FloatData],
        t: FloatData
    ) -> Generator[
        Dict[str, Union[str, int, float, List[Union[IntData, FloatData]]]],
        None,
        None
    ]:
        if not 0 <= t.payload <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            print(f'this status update came from inside the node: {i}')
            yield {'progress': i/5}
            time.sleep(1)

        split_t = number.payload * t.payload
        split_1_minus_t = number.payload * (1 - t.payload)

        yield {
            'progress': 1,
            'outputs': [
                FloatData(payload=split_t),
                FloatData(payload=split_1_minus_t)
            ]
        } 