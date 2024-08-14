from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from base_node import BaseNode, StreamingNode

MAXSIZE = 10
    

class AddNode(BaseNode):
    outputs: dict = {'addition_result': None}
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: Union[float, int], 
        b: Union[float, int],
    ) -> Dict[str, Union[float, int]]:
        time.sleep(1)
        return {'addition_result': a + b}
    

class SubtractNode(BaseNode):
    outputs: dict = {'subtraction_result': None}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int], 
        b: Union[float, int]
    ) -> Dict[str, Union[float, int]]:
        return {'subtraction_result': a - b}
    



class TestStreamingAddNode(StreamingNode):
    outputs: dict = {'addition_result': None}
    @classmethod
    def exec_stream(
        cls,
        a: Union[float, int], 
        b: Union[float, int]
    ) -> Generator[Dict[str, Union[str, Dict[str, Union[float, int]]]], None, None]:
        for i in range(5):
            yield {'status': 'progress', 'value': {'addition_result': f'progress: {i}'}}
            time.sleep(1)
        yield {'status': 'complete', 'value': {'addition_result':  a + b}}

class SplitNode(BaseNode):
    outputs: dict = {'split_t_result': None, 'split_1_minus_t_result': None}

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        number: Union[float, int], 
        t: float,
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")
        return  {'split_t_result': number * t}, {'split_1_minus_t_result': number * (1 - t)}

class TestStreamingSplitNode(StreamingNode):
    outputs: dict = {'split_t_result': None, 'split_1_minus_t_result': None}

    @classmethod
    def exec_stream(
        cls,
        number: Union[float, int], 
        t: float
    ) -> Generator[Tuple[Dict[str, Union[float, int]], Dict[str, Union[float, int]]], None, None]:
        if not 0 <= t <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            yield (
                {'status': 'progress', 'value': {'split_t_result': i * t, }},
                {'status': 'progress', 'value': {'split_1_minus_t_result': i * (1 - t)}}
            )
            time.sleep(1)

        yield (
            {'status': 'complete', 'value': {'split_t_result': number * t}},
            {'status': 'complete', 'value': {'split_1_minus_t_result': number * (1 - t)}}
        )