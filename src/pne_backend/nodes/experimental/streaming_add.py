import time
from typing import Dict, Union, List, Generator
from ...base_node import StreamingBaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData

class TestStreamingAddNode(StreamingBaseNode):
    description: str = "Test node for streaming that adds two numbers"
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                dtype='number', 
                data=FloatData(payload=0),
                metadata={
                    'max': 100,
                    'min': -100
                }
            ),
            InputNodeField(
                label='b', 
                dtype='number', 
                data=FloatData(payload=0),
                metadata={
                    'max': 100,
                    'min': -100
                }
            )
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    def exec_stream(
        cls,
        a: Union[IntData, FloatData],
        b: Union[IntData, FloatData]
    ) -> Generator[
        Dict[str, Union[str, int, float, List[Union[IntData, FloatData]]]],
        None,
        None
    ]:
        for i in range(10):
            yield {'progress': i/10, 'outputs': [
                IntData(payload=i)
            ]}
            time.sleep(1)
            print(f'this status update came from inside the node: {i}')
            
        result = a.payload + b.payload
        if isinstance(a, IntData) and isinstance(b, IntData):
            yield {'progress': 1, 'outputs': [IntData(payload=result)]}
        else:
            yield {'progress': 1, 'outputs': [FloatData(payload=result)]} 