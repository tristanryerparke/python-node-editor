from docarray import BaseDoc
import shortuuid
import time


class BaseNode(BaseDoc):
    id: str = str(shortuuid.uuid())
    name: str = ''
    description: str = ''
    inputs: dict = {}
    outputs: dict = {}

    @classmethod
    def exec(cls, **kwargs):
        print('you ran the dummy exec method of BaseNode')
        return ({'default': True},)

    def meta_exec(self):
        print(self.inputs)
        result = self.__class__.exec(**self.inputs)

        # detect if the result is a dictionary or a tuple of dictionaries (multiple outputs)
        if isinstance(result, dict):
            result = [result]
        
        for result_dict in result:
            for key, value in result_dict.items():
                self.outputs[key] = value


class StreamingNode(BaseNode):
    streaming: bool = True

    @classmethod
    def exec_stream(cls, **kwargs):
        print('you ran the dummy exec_stream method of StreamingNode')
        for i in range(10):
            yield {'status': 'progress', 'value': f'progress: {i}'}
            time.sleep(1)
        yield {'default': True}  # exec_stream now yields a dictionary
    
    def meta_exec(self):
        print(self.inputs)
        for result in self.__class__.exec_stream(**self.inputs):
            print(result)
            for key, value in result.items():
                self.outputs[key] = value
            yield result