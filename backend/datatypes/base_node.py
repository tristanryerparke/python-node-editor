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

def node_definition(inputs: list[NodeField], outputs: list[NodeField]):
    '''decorator to define the inputs and outputs of a node'''
    def decorator(func):
        nonlocal inputs
        nonlocal outputs
        for inp in inputs:
            inp.field_type = 'input'
        for outp in outputs:
            outp.field_type = 'output'
        func._inputs = inputs
        func._outputs = outputs
        def wrapper(cls, **kwargs):
            return func(cls, **kwargs)
        wrapper._inputs = inputs
        wrapper._outputs = outputs
        return wrapper
    return decorator
    

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
                self.data.inputs = getattr(self.__class__, 'exec_stream')._inputs
            else:
                self.data.inputs = getattr(self.__class__, 'exec')._inputs

    def analyze_outputs(self):
        if len(self.data.outputs) == 0:
            if self.data.streaming:
                self.data.outputs = getattr(self.__class__, 'exec_stream')._outputs
            else:
                self.data.outputs = getattr(self.__class__, 'exec')._outputs

    @classmethod
    def exec(cls, **kwargs):
        print('you ran the dummy exec method of BaseNodeData')
        return ({'default': True},)
    
    def meta_exec(self):

        kwargs = {inp.label: inp.data for inp in self.data.inputs}

        with CaptureOutput() as output:
            result = self.__class__.exec(**kwargs)

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        if len(self.data.outputs) == 1:
            self.data.outputs[0].data = result
        else:
            for outp, res in zip(self.data.outputs, result):
                outp.data = res

        self.data.status = 'evaluated'



from collections.abc import Generator

class StreamingBaseNode(BaseNode):
    data: StreamingNodeData = StreamingNodeData(streaming=True)
    
    def meta_exec_stream(self):
        
        kwargs = {inp.label: inp.data for inp in self.data.inputs}


        with CaptureOutput() as output:
            for result in self.__class__.exec_stream(**kwargs):
                self.data.progress = result.get('progress', 0)
                outputs = result.get('outputs', [])
                for outp, res in zip(self.data.outputs, outputs):
                    outp.data = res
                stdout, stderr = output.get_output()
                self.data.terminal_output += stdout
                self.data.error_output += stderr
                output.stdout = StringIO()  # Reset stdout capture
                output.stderr = StringIO()  # Reset stderr capture
                yield result

        self.data.status = 'evaluated'

