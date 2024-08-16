from docarray import BaseDoc
import shortuuid
import time
from inspect import signature, Parameter
from typing import get_origin, Union, get_args, Any, Dict
import sys

from devtools import debug as d
    

# In the app, we have general number inputs, but it is represeted as a float under the hood
def types_for_send(t):
    if get_origin(t) is Union and set(get_args(t)) == {float, int}:
        return 'number'
    elif t is float:
        return 'float'
    elif t is int:
        return 'int'
    else:
        raise ValueError(f'Unsupported type: {t}')


class NodeInput(BaseDoc):
    type: str
    default: Any
    value: Any

class BaseNode(BaseDoc):
    id: str
    name: str = ''
    namespace: str = ''
    position: dict = {
        'x': 0,
        'y': 0
    }
    description: str = ''
    inputs: Dict[str, NodeInput] = {}
    outputs: dict = {}
    streaming: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.name:
            self.name = self.__class__.__name__
        self.analyze_inputs()
        self.detect_namespace()

    def detect_namespace(self):
        module = sys.modules[self.__class__.__module__]
        self.namespace = module.__name__.split('.')[-1]

    def analyze_inputs(self):
        # Find the exec method based on the streaming flag
        if self.streaming:
            exec_method = getattr(self.__class__, 'exec_stream')
        else:
            exec_method = getattr(self.__class__, 'exec')

        sig = signature(exec_method)
        for name, param in sig.parameters.items():
            if name != 'cls':
            # Preserve existing values if they exist, otherwise use default
            
                if name not in self.inputs:
                    self.inputs[name] = NodeInput(
                        type=types_for_send(param.annotation),
                        default=param.default if param.default != Parameter.empty else None,
                        value=param.default if param.default != Parameter.empty else None
                    )


    @classmethod
    def exec(cls, **kwargs):
        print('you ran the dummy exec method of BaseNode')
        return ({'default': True},)

    def meta_exec(self):
        # Extract only the 'value' from each input
        exec_inputs = {k: v.value for k, v in self.inputs.items()}
        result = self.__class__.exec(**exec_inputs)

        # detect if the result is a dictionary or a tuple of dictionaries (multiple outputs)
        if isinstance(result, dict):
            result = [result]
        
        for result_dict in result:
            for key, value in result_dict.items():
                self.outputs[key] = value


class StreamingBaseNode(BaseNode):
    streaming: bool = True

    @classmethod
    def exec_stream(cls, **kwargs):
        print('you ran the dummy exec_stream method of StreamingBaseNode')
        for i in range(10):
            yield {'status': 'progress', 'value': f'progress: {i}'}
            time.sleep(1)
        yield {'default': True}  # exec_stream now yields a dictionary
    
    def meta_exec(self):
        exec_inputs = {k: v.value for k, v in self.inputs.items()}

        for result in self.__class__.exec_stream(**exec_inputs):
            print(result)
            for key, value in result.items():
                self.outputs[key] = value
            yield result