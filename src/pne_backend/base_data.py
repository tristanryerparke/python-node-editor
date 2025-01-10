from typing import Any, ClassVar, Union, Callable, Optional, Dict, Type
from pydantic import BaseModel, computed_field, model_validator,model_serializer, Field
from sys import getsizeof
from functools import cached_property
import uuid


LARGE_DATA_CACHE = {}

CLASS_REGISTRY: Dict[str, Type[BaseModel]] = {}

def register_class(cls: Type[BaseModel]):
    # decorator to register the class in the CLASS_REGISTRY
    CLASS_REGISTRY[cls.__name__] = cls
    return cls

def cache_key_exists(id: str) -> bool:
    return id in LARGE_DATA_CACHE


def cache_get(id: str) -> Any:
    return LARGE_DATA_CACHE[id]


def cache_set(id: str, data: Any) -> None:
    LARGE_DATA_CACHE.update({id: data})
    return True


class BaseData(BaseModel):
    payload: Any
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), repr=False)
    preview: Optional[str] = Field(default=None, repr=False)
    metadata: dict = Field(default_factory=lambda: {})

    # Class variables
    max_file_size_mb: ClassVar[float] = 0.5
    cache_set: ClassVar[Callable] = None
    cache_get: ClassVar[Callable] = None
    cache_key_exists: ClassVar[Callable] = None
    # cache_dict: ClassVar[dict] = None

    @computed_field(repr=True)
    @property
    def class_name(self) -> str:
        return self.__class__.__name__
    
    # @computed_field(repr=True)
    # @cached_property
    # def id(self) -> str:
    #     return str(uuid.uuid4())

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
    
    # @computed_field(repr=True)
    # @property
    # def dtype(self) -> str:
    #     return self.model_fields['payload'].annotation.__name__
    
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
    def validate_payload(cls, input_values, info):
        '''if the data is cached (id is in the cache), retrieve it from the cache'''

        # this means we are creating the instance on the backend
        if info.mode == 'python':
            return input_values
        
        # this means we are deserializing the from the frontend
        # it could be a cached instance or a new instance
        else:
            id = input_values.get('id')

            # if the id is in the cache, retrieve the data from the cache
            if id and cls.cache_key_exists(id):
                input_values['payload'] = cls.cache_get(id)

            # if the id is not in the cache, deserialize the data
            else:
                # if the payload is already the correct type
                input_values['payload'] = cls.deserialize_payload(input_values['payload'])  

        
            return input_values
    
    @model_serializer()
    def serialize(self):
        # get the computed and non-computed fields in a dict
        self_as_dict = {k: getattr(self, k) for k in self.model_computed_fields}
        self_as_dict |= self.__dict__.copy()

        if self.cached:
            self_as_dict['payload'] = None
            self.__class__.cache_set(self.id, self.payload)
            self_as_dict['preview'] = self.__class__.preview_payload(self.payload)


        else:
            self_as_dict['payload'] = self.__class__.serialize_payload(self.payload)
            # remove the preview field from the dict
            self_as_dict.pop('preview')

        return self_as_dict

# Default values for the class variables
BaseData.max_file_size_mb = 0.5
BaseData.cache_get = cache_get
BaseData.cache_set = cache_set
BaseData.cache_key_exists = cache_key_exists
