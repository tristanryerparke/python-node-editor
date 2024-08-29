import redis
import uuid
import json
from typing import Any, Union, Literal, ClassVar

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    PrivateAttr,
    computed_field,
    field_serializer,
    model_validator,
    field_validator,
)

from .field_data_utils import (
    db_str_serialize,
    db_str_deserialize,
    image_to_base64,
    truncate_repr,
    prep_data_for_frontend_serialization,
    prep_data_for_frontend_deserialization,
    create_thumbnail,
)


redis_client = redis.Redis(host='localhost', port=6379, db=0)


MAX_FILE_SIZE_MB = 0.1


class Data(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4())) # id is for retrieving large data from the db
    dtype: Literal['json', 'numpy', 'image', 'basemodel'] # dtype helps us know how to save, load, serialize, deserialize
    data: Any = None # front facing data attribute / preview
    # _data: Any = PrivateAttr(default=None)  # this is the "true" data attribute where full data is stored
    max_file_size_mb: float = Field(default=MAX_FILE_SIZE_MB)
    class_name: str
    class_options: ClassVar[dict] = {}

    @field_serializer('data')
    def serialize_data(self, data: Any, _info: Any) -> Any:
        '''return a truncated repr of the data if big (cached), otherwise return the data'''
        if self.cached:
            redis_client.set(self.id, db_str_serialize(self.dtype, self.data))
            print(f"SERIALIZED cached data for id: {self.id}")
            if self.dtype == 'image':
                return create_thumbnail(data, self.max_file_size_mb)
            else:
                return truncate_repr(data)
        else:
            return prep_data_for_frontend_serialization(self.dtype, data)
    
    @computed_field(alias='cached', title='Flag for large data cached in db', repr=True)
    @property
    def cached(self) -> bool:
        '''for large data, we cache in redis db, this checks the size and assigns the flag'''
        if self.size_mb >= self.max_file_size_mb:
            return True
        else:
            return False
        
    @computed_field(alias='description', title='Data Description', repr=True)
    def description(self) -> str:
        '''returns a description of the data'''
        if self.dtype == 'json':
            return None
        elif self.dtype == 'numpy':
            return f'{self.data.shape}'
        elif self.dtype == 'image':
            return f'Image: {self.data.shape[1]}x{self.data.shape[0]}px'
        elif self.dtype == 'basemodel':
            return f'{self.data.class_name} instance'
        else:
            raise TypeError('unsupported dtype for description')
    
    @computed_field(alias='size_mb', title='Size in Megabytes', repr=True)
    @property
    def size_mb(self) -> float:
        '''calculates an attribute for the data size in megabytes'''

        if self.dtype == 'json':
            json_data = json.dumps(self.data)
            size = len(json_data.encode('utf-8'))
        elif self.dtype == 'numpy' or self.dtype == 'image':
            size = self.data.nbytes
        elif self.dtype == 'basemodel':
            size = len(json.dumps(self.data.model_dump()).encode('utf-8'))
        else:
            raise TypeError(f'Invalid dtype: {self.dtype}')
        
        return size / (1024 * 1024)

    @model_validator(mode='before')
    @classmethod
    def load_cached_data(cls, values):
        '''loads data from cache if the id is in the cache, and replaces the data attribute with the deserialized data'''
        if values.get('cached') and redis_client.exists(values.get('id')):
            cached_data = redis_client.get(values['id']).decode('utf-8')
            values['data'] = db_str_deserialize(cls, values['dtype'], cached_data)
            print(f"DESERIALIZED cached data for id: {values['id']}")
        else:
            values['data'] = prep_data_for_frontend_deserialization(values['dtype'], values['data'])
            if values['dtype'] == 'basemodel':
                if isinstance(values['data'], dict):
                    values['data'] = cls.class_options[values['data']['class_name']].model_validate(values['data'])
        # add the class name to the values
        values['class_name'] = cls.__name__
        return values