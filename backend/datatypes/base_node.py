
from typing import TypeVar, Generic, NamedTuple, Tuple
import shortuuid
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

from pydantic import BaseModel

from .fields import NodeInput, NodeOutput, NodeOutputImage, NodeOutputNumber, NodeOutputString, input_class_from_type_name, output_class_from_type_name

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

TI = TypeVar('TI', bound=NodeInput)
TO = TypeVar('TO', bound=NodeOutput)

class BaseNodeData(BaseModel):
    name: str = ''
    namespace: str = ''
    status: str = ['not evaluated', 'pending', 'executing', 'streaming', 'evaluated', 'error'][0]
    terminal_output: str = ''
    error_output: str = ''
    description: str = ''
    inputs: List[TI] = []
    outputs: List[TO] = []
    streaming: bool = False
    definition_path: str = ''


def image_to_base64(im: np.ndarray) -> str:
    buffered = BytesIO()
    img = Image.fromarray(im)
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"

class BaseNode(BaseModel):
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            np.ndarray: image_to_base64
        }

    id: str = ''
    position: NodePosition = NodePosition(x=0, y=0)
    data: BaseNodeData = BaseNodeData()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.data.name:
            self.data.name = self.__class__.__name__
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

            # print(f'{self.data.name.upper()} INPUTS:')

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

        # d(input_instances)

        new_input_instances = []
        for input_inst in input_instances:
            new_class = input_class_from_type_name(input_inst.type)
            # print(f'changing input type of {input_inst} to {new_class}')
            new_input_instances.append(new_class(
                label=input_inst.label, 
                type=input_inst.type,
                input_data=input_inst.input_data
            ))
        
        self.data.inputs = new_input_instances

    def analyze_outputs(self):
        if len(self.data.outputs) == 0:

            if self.data.streaming:
                exec_method = getattr(self.__class__, 'exec_stream')
            else:
                exec_method = getattr(self.__class__, 'exec')

            

            sig = signature(exec_method)
            # d(get_origin(sig.return_annotation))
            if isinstance(sig.return_annotation, NodeOutput):
                output_instances = [sig.return_annotation]
            elif get_origin(sig.return_annotation) is tuple:
                output_instances = list(get_args(sig.return_annotation))
            else:
                output_instances = list(sig.return_annotation)
        
        else:
            output_instances = self.data.outputs

        # d(output_instances)

        # change the type of the output instances to the correct class
        new_output_instances = []
        for output_inst in output_instances:
            new_class = output_class_from_type_name(output_inst.type)
            # print(f'changing output type of {output_inst} to {new_class}')
            
            new_output_instances.append(new_class(
                label=output_inst.label, 
                type=output_inst.type,
                output_data=output_inst.output_data
            ))
        
        self.data.outputs = new_output_instances
        
        # d(self.data.outputs)




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
            kwargs[name] = inpt.input_data   
        
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
        exec_inputs = {k: v.input_data for k, v in self.data.inputs.items()}

        with CaptureOutput() as output:
            for result in self.__class__.exec_stream(**exec_inputs):
                for key, value in result.items():
                    self.data.outputs[key].output_data = value
                yield result

        stdout, stderr = output.get_output()
        self.data.terminal_output = stdout
        self.data.error_output = stderr

        self.data.status = 'evaluated'