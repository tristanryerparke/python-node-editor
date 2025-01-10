
from typing import Annotated, Literal
from pydantic import ConfigDict, WithJsonSchema
import numpy as np


from ..base_data import BaseData, register_class

@register_class
class IntData(BaseData):
    payload: int

@register_class
class FloatData(BaseData):
    payload: float

@register_class
class StringData(BaseData):
    payload: str

@register_class
class NumpyData(BaseData):
    model_config = ConfigDict(arbitrary_types_allowed=True)
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
    

@register_class
class UnitsData(StringData):
    payload: str = Literal['mm', 'in']