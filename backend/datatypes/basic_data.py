from .cachable_data import CachableData
from typing import Annotated
from pydantic import BaseModel, ConfigDict, WithJsonSchema
import numpy as np

class IntData(CachableData):
    payload: int

class FloatData(CachableData):
    payload: float

class StringData(CachableData):
    payload: str

class NumpyData(CachableData):
    model_config: ConfigDict = {
        'arbitrary_types_allowed': True,
    }
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