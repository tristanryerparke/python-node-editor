from typing import Generic, NamedTuple, Tuple
import numpy as np
import time
from inspect import signature, Parameter
from typing import get_origin, Union, get_args, Any, Dict, get_type_hints, List
import sys
from io import StringIO
import base64
from PIL import Image
from io import BytesIO
from devtools import debug as d

from pydantic import BaseModel, ConfigDict

from .field import NodeField
from devtools import debug as d
    

class CaptureOutput:
    def __init__(self):
        self.stdout = StringIO()
        self.stderr = StringIO()

    def __enter__(self):
        self.old_stdout, self.old_stderr = sys.stdout, sys.stderr
        sys.stdout = self
        sys.stderr = self
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self.old_stdout
        sys.stderr = self.old_stderr

    def write(self, message):
        self.old_stdout.write(message)
        self.stdout.write(message)

    def flush(self):
        self.old_stdout.flush()
        self.stdout.flush()

    def get_output(self):
        return self.stdout.getvalue(), self.stderr.getvalue()
    
class NodePosition(BaseModel):
    x: float
    y: float

class BaseNodeData(BaseModel):
    display_name: str = ''
    class_name: str = ''
    namespace: str = ''
    status: str = ['not evaluated', 'pending', 'executing', 'streaming', 'evaluated', 'error'][0]
    terminal_output: str = ''
    error_output: str = ''
    description: str = ''
    inputs: List[NodeField] = []
    outputs: List[NodeField] = []
    streaming: bool = False
    definition_path: str = ''

class StreamingNodeData(BaseNodeData):
    progress: float = 0


def image_to_base64(im: np.ndarray) -> str:
    buffered = BytesIO()
    img = Image.fromarray(im)
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"

class BaseNode(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True) 

    id: str = ''
    position: NodePosition = NodePosition(x=0, y=0)
    data: BaseNodeData = BaseNodeData()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.data.class_name:
            self.data.class_name = self.__class__.__name__
        if not self.data.display_name:
            self.data.display_name = self.__class__.__name__.replace('Node', '')
        self.analyze_inputs()
        self.analyze_outputs()
        self.detect_namespace()
        self.data.definition_path = self.__class__.definition_path

    def detect_namespace(self):
        module = sys.modules[self.__class__.__module__]
        self.data.namespace = getattr(module, 'DISPLAY_NAME', module.__name__.split('.')[-1])

    def analyze_inputs(self):
        
        if len(self.data.inputs) == 0:
            if self.data.streaming:
                exec_method = getattr(self.__class__, 'exec_stream')
            else:
                exec_method = getattr(self.__class__, 'exec')

            input_instances = []

            sig = signature(exec_method)
            for name, param in sig.parameters.items():
                if name != 'cls':
                    # d(param.annotation)
                    names = [i.label for i in self.data.inputs]
                    if name not in names:
                        input_instances.append(param.annotation)

        else:
            input_instances = self.data.inputs


        self.data.inputs = input_instances


    def analyze_outputs(self):
        if len(self.data.outputs) == 0:

            if self.data.streaming:
                exec_method = getattr(self.__class__, 'exec_stream')
            else:
                exec_method = getattr(self.__class__, 'exec')

            sig = signature(exec_method)

            if isinstance(sig.return_annotation, NodeField):
                self.data.outputs = [sig.return_annotation]
            elif get_origin(sig.return_annotation) is tuple:
                self.data.outputs = list(get_args(sig.return_annotation))
            else:
                self.data.outputs = list(sig.return_annotation)
         

    @classmethod
    def exec(cls, **kwargs):
        print('you ran the dummy exec method of BaseNodeData')
        return ({'default': True},)
    
    def meta_exec(self):
        # Extract only the 'value' from each input

        exec_method = getattr(self.__class__, 'exec')
        kwargs = {}
        sig = signature(exec_method)
        
        for name, inpt in zip(sig.parameters.keys(), self.data.inputs):
            kwargs[name] = inpt
        
        with CaptureOutput() as output:
            result = self.__class__.exec(**kwargs)

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        if isinstance(result, tuple):
            result = list(result)
        else:
            result = [result]

        self.data.outputs = result

        self.data.status = 'evaluated'



from collections.abc import Generator

class StreamingBaseNode(BaseNode):
    data: StreamingNodeData = StreamingNodeData(streaming=True)

    def analyze_outputs(self):
        if len(self.data.outputs) == 0:

            if self.data.streaming:
                exec_method = getattr(self.__class__, 'exec_stream')
            else:
                exec_method = getattr(self.__class__, 'exec')

            sig = signature(exec_method)

            func_outputs = get_args(get_args(sig.return_annotation)[0])
        

            outputs = get_args(func_outputs[1:][0])[3]

            print(type(outputs))

            if isinstance(outputs, NodeField):
                self.data.outputs = [outputs]
                
            else:
                self.data.outputs = list(get_args(outputs))
                
            d(self.data.outputs)

    
    def meta_exec(self):

        exec_method = getattr(self.__class__, 'exec_stream')
        kwargs = {}
        sig = signature(exec_method)

        for name, inpt in zip(sig.parameters.keys(), self.data.inputs):
            kwargs[name] = inpt

        with CaptureOutput() as output:
            for result in exec_method(**kwargs):
                self.data.progress = result.get('progress', 0)
                self.data.outputs = result.get('outputs', self.data.outputs)
                stdout, stderr = output.get_output()
                self.data.terminal_output += stdout
                self.data.error_output += stderr
                output.stdout = StringIO()  # Reset stdout capture
                output.stderr = StringIO()  # Reset stderr capture
                yield result

        self.data.status = 'evaluated'

        if isinstance(result, tuple):
            result = list(result)
        else:
            result = [result]

        self.data.status = 'evaluated'

