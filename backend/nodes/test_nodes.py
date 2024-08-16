from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from base_node import BaseNode, StreamingBaseNode

MAXSIZE = 10
    

class AddNode(BaseNode):
    outputs: dict = {'addition_result': None}
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        return {'addition_result': a + b}
    

class SubtractNode(BaseNode):
    outputs: dict = {'subtraction_result': None}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        return {'subtraction_result': a - b}
    



class TestStreamingAddNode(StreamingBaseNode):
    outputs: dict = {'addition_result': None}
    @classmethod
    def exec_stream(
        cls,
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Generator[Dict[str, Union[str, Dict[str, Union[float, int]]]], None, None]:
        for i in range(5):
            yield {'status': 'progress', 'addition_result': f'progress: {i}'}
            time.sleep(1)
        yield {'status': 'complete', 'addition_result':  a + b}

class SplitNode(BaseNode):
    outputs: dict = {'split_t_result': None, 'split_1_minus_t_result': None}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        number: Union[float, int] = 1, 
        t: float = 0.5,
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return  {'split_t_result': number * t}, {'split_1_minus_t_result': number * (1 - t)}

class TestStreamingSplitNode(StreamingBaseNode):
    outputs: dict = {'split_t_result': None, 'split_1_minus_t_result': None}

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
                'split_t_result': i * t,
                'split_1_minus_t_result': i * (1 - t)
                
            }
            time.sleep(1)

        yield {
            'status': 'complete',
            'split_t_result': number * t,
            'split_1_minus_t_result': number * (1 - t)
            
        }