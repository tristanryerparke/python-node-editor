from pydantic import BaseModel
import shortuuid
import time
from inspect import signature, Parameter
from typing import get_origin, Union, get_args, Any, Dict
import sys
from io import StringIO

from devtools import debug as d
    

# In the app, we have general number inputs, but it is represeted as a float under the hood
def types_for_send(t):
    if get_origin(t) is Union and set(get_args(t)) == {float, int}:
        return 'number'
    elif t is float:
        return 'float'
    elif t is int:
        return 'int'
    elif t is str:
        return 'str'
    else:
        raise ValueError(f'Unsupported type: {t}')


class NodeInput(BaseModel):
    type: str
    value: Any

class NodeOutput(BaseModel):
    type: str
    value: Any = None

class CaptureOutput:
    def __init__(self):
        self.stdout = StringIO()
        self.stderr = StringIO()

    def __enter__(self):
        self.old_stdout, self.old_stderr = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = self.stdout, self.stderr
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout, sys.stderr = self.old_stdout, self.old_stderr

    def get_output(self):
        return self.stdout.getvalue(), self.stderr.getvalue()
    
class NodePosition(BaseModel):
    x: float
    y: float

class BaseNodeData(BaseModel):
    name: str = ''
    namespace: str = ''
    status: str = ['not evaluated', 'pending', 'executing', 'streaming', 'evaluated', 'error'][0]
    terminal_output: str = ''
    error_output: str = ''
    description: str = ''
    inputs: Dict[str, NodeInput] = {}
    outputs: Dict[str, NodeOutput] = {}
    streaming: bool = False
    definition_path: str = ''


class BaseNode(BaseModel):
    id: str = ''
    position: NodePosition = NodePosition(x=0, y=0)
    data: BaseNodeData = BaseNodeData()


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.data.name:
            self.data.name = self.__class__.__name__
        self.analyze_inputs()
        self.detect_namespace()
        self.data.definition_path = self.__class__.definition_path

    def detect_namespace(self):
        module = sys.modules[self.__class__.__module__]
        self.data.namespace = getattr(module, 'DISPLAY_NAME', module.__name__.split('.')[-1])

    def analyze_inputs(self):
        # Find the exec method based on the streaming flag
        if self.data.streaming:
            exec_method = getattr(self.__class__, 'exec_stream')
        else:
            exec_method = getattr(self.__class__, 'exec')

        sig = signature(exec_method)
        for name, param in sig.parameters.items():
            if name != 'cls':
            # Preserve existing values if they exist, otherwise use default
            
                if name not in self.data.inputs:
                    self.data.inputs[name] = NodeInput(
                        type=types_for_send(param.annotation),
                        default=param.default if param.default != Parameter.empty else None,
                        value=param.default if param.default != Parameter.empty else None
                    )


    @classmethod
    def exec(cls, **kwargs):
        print('you ran the dummy exec method of BaseNodeData')
        return ({'default': True},)

    def meta_exec(self):
        # Extract only the 'value' from each input
        exec_inputs = {k: v.value for k, v in self.data.inputs.items()}
        
        with CaptureOutput() as output:
            result = self.__class__.exec(**exec_inputs)

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        # detect if the result is a dictionary or a tuple of dictionaries (multiple outputs)
        if isinstance(result, dict):
            result = [result]
        
        for result_dict in result:
            for key, value in result_dict.items():
                self.data.outputs[key].value = value

        self.data.status = 'evaluated'


class StreamingBaseNode(BaseNode):
    data: BaseNodeData = BaseNodeData(streaming=True)

    @classmethod
    def exec_stream(cls, **kwargs):
        print('you ran the dummy exec_stream method of StreamingBaseNodeData')
        for i in range(10):
            yield {'status': 'progress', 'value': f'progress: {i}'}
            time.sleep(1)
        yield {'default': True}  # exec_stream now yields a dictionary
    
    def meta_exec(self):
        exec_inputs = {k: v.value for k, v in self.data.inputs.items()}

        with CaptureOutput() as output:
            for result in self.__class__.exec_stream(**exec_inputs):
                for key, value in result.items():
                    self.data.outputs[key].value = value
                yield result

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        self.data.status = 'evaluated'