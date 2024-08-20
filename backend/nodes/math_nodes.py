from typing import Tuple, Union, Dict, Generator
# add base_node file to path
from functools import lru_cache
import sys
import time
sys.path.append('./')
from base_node import BaseNode, BaseNodeData, StreamingBaseNode, NodeOutput

MAXSIZE = 10


DISPLAY_NAME = "Math"
    

class AddNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'result': NodeOutput(type='number')
        }
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        '''
        Adds two numbers together
        '''
        return {'result': a + b}
    

class AddNodeNoDefault(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'result': NodeOutput(type='number')
        }
    )
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: Union[float, int],
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        '''
        Adds two numbers together
        '''
        return {'result': a + b}
    

class SubtractNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'result': NodeOutput(type='number')
        }
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls,
        a: Union[float, int] = 0, 
        b: Union[float, int] = 0,
    ) -> Dict[str, Union[float, int]]:
        return {'result': a - b}
    

class MultiplyNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'result': NodeOutput(type='number')
        }
    )

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
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'result': NodeOutput(type='number')
        }
    )

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


class SplitNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'split_t': NodeOutput(type='number'),
            'split_1_minus_t': NodeOutput(type='number')
        }
    )

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

