import time
from typing import Dict, Union, List, Generator
from ...datatypes.base_node import StreamingBaseNode, node_definition
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData

class TestStreamingAddNode(StreamingBaseNode):
    description: str = "Test node for streaming that adds two numbers"
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
    def exec_stream(
        cls,
        a: FieldData,
        b: FieldData
    ) -> Generator[
        Dict[str, Union[str, int, float, List[FieldData]]],
        None,
        None
    ]:
        for i in range(10):
            yield {'progress': i/10, 'outputs': [
                FieldData(payload=i, dtype='number')
            ]}
            time.sleep(1)
            print(f'this status update came from inside the node: {i}')
            result = a.payload + b.payload
        yield {'progress': 1, 'outputs': [FieldData(payload=result, dtype='number')]} 