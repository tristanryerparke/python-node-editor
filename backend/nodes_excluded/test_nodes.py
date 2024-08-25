from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from backend.datatypes.base_node import BaseNode, StreamingBaseNode, NodeOutput

MAXSIZE = 10

DISPLAY_NAME = "Test"

class TestStreamingAddNode(StreamingBaseNode):
    '''Test node for streaming that adds two numbers'''
    outputs: Dict[str, NodeOutput] = {'result': NodeOutput(type='number')}
    @classmethod
    def exec_stream(
        cls,
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Generator[Dict[str, Union[str, Dict[str, Union[float, int]]]], None, None]:
        for i in range(5):
            yield {'status': 'progress', 'result': f'progress: {i}'}
            time.sleep(1)
        yield {'status': 'complete', 'result':  a + b}



class TestStreamingSplitNode(StreamingBaseNode):
    '''Test node for streaming that splits a number into two numbers'''
    outputs: Dict[str, NodeOutput] = {'split_t': NodeOutput(type='number'), 'split_1_minus_t': NodeOutput(type='number')}

    @classmethod
    def exec_stream(
        cls,
        number: Union[float, int] = 1, 
        t: float = 0.5,
    ) -> Generator[Dict[str, Union[str, Dict[str, Union[float, int]]]], None, None]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            yield {
                'status': 'progress',
                'split_t': i * t,
                'split_1_minus_t': i * (1 - t)
                
            }
            time.sleep(1)

        yield {
            'status': 'complete',
            'split_t': number * t,
            'split_1_minus_t': number * (1 - t)
            
        }


