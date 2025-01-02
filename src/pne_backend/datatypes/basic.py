
from typing import Annotated, Literal
from pydantic import ConfigDict, WithJsonSchema
import numpy as np


from ..base_data import BaseData

class IntData(BaseData):
    class_name: str = 'IntData'
    payload: int

class FloatData(BaseData):
    class_name: str = 'FloatData'
    payload: float

class StringData(BaseData):
    class_name: str = 'StringData'
    payload: str

class NumpyData(BaseData):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    class_name: str = 'NumpyData'
    payload: Annotated[np.ndarray, WithJsonSchema({'type': 'ndarray'})]

    @classmethod
    def serialize_payload(cls, payload: np.ndarray) -> np.ndarray:
        '''pydantic can't serialize numpy arrays, so we need to do it manually'''
        return payload.tolist()

    @classmethod
    def deserialize_payload(cls, serialized_payload: np.ndarray) -> np.ndarray:
        '''recreate the numpy array from a list of lists'''
        return np.array(serialized_payload)

    @classmethod
    def preview_payload(cls, payload: np.ndarray) -> np.ndarray:
        '''return a string representation of the numpy array'''
        return payload.__repr__()
    

class UnitsData(StringData):
    payload: str = Literal['mm', 'in']
