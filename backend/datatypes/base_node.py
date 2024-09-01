
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
                output_instances = [sig.return_annotation]
            elif get_origin(sig.return_annotation) is tuple:
                output_instances = list(get_args(sig.return_annotation))
            else:
                output_instances = list(sig.return_annotation)
        
        else:
            output_instances = self.data.outputs
        
        self.data.outputs = output_instances

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
        exec_inputs = {k: v.data for k, v in self.data.inputs.items()}

        with CaptureOutput() as output:
            for result in self.__class__.exec_stream(**exec_inputs):
                for key, value in result.items():
                    self.data.outputs[key].output_data = value
                yield result

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        self.data.status = 'evaluated'