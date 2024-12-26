from typing import Optional, Any
from pydantic import Field, computed_field, model_validator
from pne_backend.base_data import SendableDataModel

LARGE_DATA_CACHE = {}


def cache_key_exists(id: str) -> bool:
    return id in LARGE_DATA_CACHE


def cache_get(id: str) -> Any:
    return LARGE_DATA_CACHE[id]


def cache_set(id: str, data: Any) -> None:
    LARGE_DATA_CACHE.update({id: data})

class BaseData(SendableDataModel):
    id: Optional[str] = None
    payload: Any
    preview: Optional[str] = None
    metadata: dict = Field(default_factory=lambda: {})

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
    
    @model_validator(mode='before')
    @classmethod
    def validate_payload(cls, data):
        '''if the data is cached (id is in the cache), retrieve it from the cache'''
        
        data['class_name'] = cls.__name__ # used to infer subclasses when deserializing

        # if an id is not provided, generate a new one
        id = data.get('id')
        if id is None:
            data['id'] = str(uuid.uuid4())
        
        # if the id is in the cache, retrieve the data from the cache
        if id and cls.cache_key_exists(id):
            data['payload'] = cls.cache_get(id)
        
        # if the data is not in the cache, deserialize the data
        else:
            if data['payload'] is None:
                raise ValueError('Payload is None')
            # the deserialize function should avoid deserializing
            # if the payload is already the correct type
            data['payload'] = cls.deserialize_payload(data['payload'])
        return data
    
