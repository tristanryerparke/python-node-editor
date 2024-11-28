from typing import Any, ClassVar, Union, Callable
from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator, model_serializer
from sys import getsizeof
import uuid
import numpy as np
from devtools import debug as d
from PIL import Image
import json

LARGE_DATA_CACHE = {}

def cache_key_exists(id: str) -> bool:
    return id in LARGE_DATA_CACHE

def cache_get(id: str) -> Any:
    return LARGE_DATA_CACHE[id]

def cache_set(id: str, data: Any) -> None:
    LARGE_DATA_CACHE.update({id: data})

class CachableData(BaseModel):
    id: Union[str, None] = None
    payload: Any
    preview: Union[str, None] = None
    class_name: str # used to infer subclasses when deserializing

    # Class variables
    max_file_size_mb: ClassVar[float] = 0.1
    cache_set: ClassVar[Callable] = None
    cache_get: ClassVar[Callable] = None
    cache_key_exists: ClassVar[Callable] = None
    cache_dict: ClassVar[dict] = None

    @computed_field(repr=True)
    @property
    def cached(self) -> bool:
        if self.size_mb >= self.max_file_size_mb:
            return True
        else:
            return False
        
    @computed_field(repr=True)
    @property
    def size_mb(self) -> float:
        return round(getsizeof(self.payload) / 1024 / 1024, 2)
    
    @computed_field(repr=True)
    @property
    def dtype(self) -> str:
        return self.model_fields['payload'].annotation.__name__
    
    @classmethod
    def serialize_payload(cls, payload: Any) -> Any:
        return payload
    
    @classmethod
    def deserialize_payload(cls, serialized_payload: Any) -> Any:
        return serialized_payload
    
    @classmethod
    def preview_payload(cls, payload: Any) -> Any:
        return f'{payload.__repr__()[:50]}...'
        
    @model_validator(mode='before')
    @classmethod
    def validate_payload(cls, data):
        '''if the data is cached (id is in the cache), retrieve it from the cache'''
        data['class_name'] = cls.__name__ # used to infer subclasses when deserializing
        id = data.get('id')
        if id and cls.cache_key_exists(id):
            data['payload'] = cls.cache_get(id)
        # otherwise, we just deserialize the data
        else:
            if data['payload'] is None:
                raise ValueError('Payload is None')
            data['payload'] = cls.deserialize_payload(data['payload'])
        return data
    
    @model_serializer()
    def serialize(self):
        self_as_dict = self.__dict__.copy()

        # add computed fields to the dict
        self_as_dict['dtype'] = self.dtype
        self_as_dict['cached'] = self.cached
        self_as_dict['size_mb'] = self.size_mb

        if self.cached:
            self_as_dict['payload'] = None
            id = str(uuid.uuid4())
            self.id = id
            self_as_dict['id'] = id
            self.__class__.cache_set(id, self.payload)
            self_as_dict['preview'] = self.__class__.preview_payload(self.payload)
            return self_as_dict
        else:
            self_as_dict['payload'] = self.__class__.serialize_payload(self.payload)
            # remove the preview field from the dict
            self_as_dict.pop('preview')
            return self_as_dict
        
    def __eq__(self, other: 'CachableData'):
        return self.model_dump() == other.model_dump()

        

# Default values for the class variables
CachableData.max_file_size_mb = 0.1
CachableData.cache_get = cache_get
CachableData.cache_set = cache_set
CachableData.cache_key_exists = cache_key_exists
CachableData.cache_dict = LARGE_DATA_CACHE

