from pydantic import BaseModel, Field
from typing import List, Literal, ClassVar
import uuid
import sys
from io import StringIO

from .field import InputNodeField, OutputNodeField

def node_definition(inputs: list[InputNodeField], outputs: list[OutputNodeField]):
    '''decorator to define the inputs and outputs of a node'''
    def decorator(func):
        nonlocal inputs
        nonlocal outputs
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
    status: Literal[
        'not evaluated', 
        'pending', 
        'executing', 
        'streaming', 
        'evaluated', 
        'error'
    ] = 'not evaluated'
    terminal_output: str = ''
    error_output: str = ''
    description: str = ''
    inputs: List[InputNodeField] = []
    outputs: List[OutputNodeField] = []
    streaming: bool = False
    definition_path: str = ''



class BaseNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: BaseNodeData = BaseNodeData()
    width: int = 250


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.data.class_name:
            self.data.class_name = self.__class__.__name__
        if not self.data.display_name:
            self.data.display_name = self.__class__.__name__.replace(
                'Node', '')
        self.analyze_inputs()
        self.analyze_outputs()
        self.detect_namespace()
        self.data.definition_path = self.__class__.definition_path

    def detect_namespace(self):
        '''detects the namespace of the node to display in the frontend'''
        module = sys.modules[self.__class__.__module__]
        self.data.namespace = getattr(module, 'DISPLAY_NAME', module.__name__.split('.')[-1])

    def analyze_inputs(self):
        '''retrives the decorated inputs adds them to the node data definition'''
        if len(self.data.inputs) == 0:
            if self.data.streaming:
                self.data.inputs = getattr(
                    self.__class__, 'exec_stream')._inputs
            else:
                self.data.inputs = getattr(self.__class__, 'exec')._inputs

    def analyze_outputs(self):
        '''retrives the decorated outputs adds them to the node data definition'''
        if len(self.data.outputs) == 0:
            if self.data.streaming:
                self.data.outputs = getattr(
                    self.__class__, 'exec_stream')._outputs
            else:
                self.data.outputs = getattr(self.__class__, 'exec')._outputs

    def meta_exec(self):
        '''executes the node's exec method, captures the execution output and updates the ouput data(s)'''
        exec_kwargs = {inp.label: inp.data for inp in self.data.inputs}
        with CaptureOutput() as output:
            results = self.exec(**exec_kwargs)
            stdout, stderr = output.get_output()
            self.data.terminal_output = stdout
            self.data.error_output = stderr

        # nodes with only one output will return a single FieldData object
        if len(self.data.outputs) == 1:
            results = [results]

        for outp, res in zip(self.data.outputs, results):
            outp.data = res

        return results

class StreamingNodeData(BaseNodeData):
    '''inherits from BaseNodeData and adds a progress attribute'''
    progress: float = 0

class StreamingBaseNode(BaseNode):
    '''enables data to be streamed during sequential execution of a node'''
    data: StreamingNodeData = StreamingNodeData(streaming=True)
    
    def meta_exec_stream(self):
        '''executes the node's exec_stream method, captures the execution output and updates the ouput data(s)'''
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