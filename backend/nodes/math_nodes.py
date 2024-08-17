from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from base_node import BaseNode, StreamingBaseNode, NodeOutput

MAXSIZE = 10
    

class AddNode(BaseNode):
    outputs: Dict[str, NodeOutput] = {'result': NodeOutput(type='number')}
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        # print(f'Adding {a} and {b}')
        # print('hi this is a test')
        # print(mf)
        return {'result': a + b}
    

class SubtractNode(BaseNode):
    outputs: Dict[str, NodeOutput] = {'result': NodeOutput(type='number')}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        return {'result': a - b}
    

class MultiplyNode(BaseNode):
    outputs: Dict[str, NodeOutput] = {'result': NodeOutput(type='number')}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int] = 1, 
        b: Union[float, int] = 1,
    ) -> Dict[str, Union[float, int]]:
        print(f'Multiplying {a} and {b} to get {a * b}')
        return {'result': a * b}

class DivideNode(BaseNode):
    outputs: Dict[str, NodeOutput] = {'result': NodeOutput(type='number')}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int] = 1, 
        b: Union[float, int] = 1,
    ) -> Dict[str, Union[float, int]]:
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return {'result': a / b}

class TestStreamingAddNode(StreamingBaseNode):
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

class SplitNode(BaseNode):
    outputs: Dict[str, NodeOutput] = {'split_t': NodeOutput(type='number'), 'split_1_minus_t': NodeOutput(type='number')}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        number: Union[float, int] = 1, 
        t: float = 0.5,
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return  {'split_t': number * t}, {'split_1_minus_t': number * (1 - t)}

class TestStreamingSplitNode(StreamingBaseNode):
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