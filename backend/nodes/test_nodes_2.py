from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import sys
import time
from typing import List
from collections import namedtuple
from classes import NodeInput, NodeOutput, NodeOutputNumber
from base_node import BaseNode, BaseNodeData, StreamingBaseNode

MAXSIZE = 10



DISPLAY_NAME = "Test 2"
    

class AddNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs=[NodeOutput(label='result', type='number')]
    )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: NodeInput(label='a', type='number', value=0),
        b: NodeInput(label='b', type='number')
    ):
        #NodeOutput(label='result', type='number')
        '''
        Adds two numbers together
        '''
        return NodeOutput(label='result', type='number', value=a + b)
    

class AddSubtractNode(BaseNode):
    # data: BaseNodeData = BaseNodeData(
    #     outputs=[NodeOutput(label='result', type='number'), NodeOutput(label='result', type='str')]
    # )

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        a: NodeInput(label='a', type='number', value=0),
        b: NodeInput(label='b', type='number')
    ) -> Tuple[NodeOutput(label='result', type='number'), NodeOutput(label='result', type='str')]:
        '''
        Adds two numbers together
        '''
        return (NodeOutput(label='result', type='number', value=a + b), 
                NodeOutput(label='result', type='str', value=str(a - b)))