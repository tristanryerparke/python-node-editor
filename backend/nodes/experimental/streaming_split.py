import time
from typing import Dict, Union, List, Generator
from ...datatypes.base_node import StreamingBaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

class TestStreamingSplitNode(StreamingBaseNode):
    description: str = "Test node for streaming that splits a number into two numbers"
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
    def exec_stream(
        cls,
        number: FieldData,
        t: FieldData
    ) -> Generator[
        Dict[str, Union[str, int, float, List[FieldData]]],
        None,
        None
    ]:
        if not 0 <= t.payload <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            print(f'this status update came from inside the node: {i}')
            yield {'progress': i/5}
            time.sleep(1)

        yield {
            'progress': 1,
            'outputs': [
                FieldData(payload=number.payload * t.payload, dtype='number'),
                FieldData(payload=number.payload * (1 - t.payload), dtype='number')
            ]
        } 