import uuid
import json
from typing import Any, Union, Literal, ClassVar, FrozenSet, Tuple

from pydantic import (
    BaseModel,
    ConfigDict,
    Field as PydanticField,
    computed_field,
    field_serializer,
    model_validator,
)

from .field_data_utils import (
    truncate_repr,
    prep_data_for_frontend_serialization,
    prep_data_for_frontend_deserialization,
    create_thumbnail,
    LARGE_DATA_CACHE,
)

MAX_FILE_SIZE_MB = 0.1


class NodeField(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, debug=True)

    id: str = PydanticField(default_factory=lambda: str(uuid.uuid4())) # id is for retrieving large data from the db
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'basemodel'] # dtype helps us know how to save, load, serialize, deserialize
    data: Any = None # front facing data attribute / preview
    max_file_size_mb: float = PydanticField(default=MAX_FILE_SIZE_MB)
    class_name: str
    class_options: ClassVar[dict] = {}
    field_type: Literal['input', 'output'] = 'input'
    label: str = ''

    @field_serializer('data')
    def serialize_data(self, data: Any, _info: Any) -> Any:
        '''return a truncated repr of the data if big (cached), otherwise return the data'''
        if self.cached:
            LARGE_DATA_CACHE[self.id] = data
            print(f"Stored data in LARGE_DATA_CACHE for id: {self.id}")
            if self.dtype == 'image':
                return create_thumbnail(data, self.max_file_size_mb)
            else:
                return truncate_repr(data)
        else:
            return prep_data_for_frontend_serialization(self.dtype, data)
    
    @computed_field(alias='cached', title='Flag for large data cached in db', repr=True)
    @property
    def cached(self) -> bool:
        '''for large data we need tocache, this checks the size and assigns the flag'''
        if self.size_mb >= self.max_file_size_mb:
            return True
        else:
            return False
        
    @computed_field(alias='description', title='Data Description', repr=True)
    def description(self) -> str:
        '''returns a description of the data'''
        if isinstance(self.data, type(None)):
            return ''
        if self.dtype == 'json' or self.dtype == 'string' or self.dtype == 'number':
            return 'basic data type'
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
        if isinstance(self.data, type(None)):
            return 0

        if self.dtype == 'json' or self.dtype == 'string' or self.dtype == 'number':
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
    def load_cached_data(cls, values: dict):
        '''loads data from cache if the id is in the cache, and replaces the data attribute with the deserialized data'''
        if values.get('cached', False):
            if values['id'] in LARGE_DATA_CACHE:
                values['data'] = LARGE_DATA_CACHE[values['id']]
                print(f"Loaded data from LARGE_DATA_CACHE for id: {values['id']}")
        else:
            if values.get('data', None) is not None:
                values['data'] = prep_data_for_frontend_deserialization(values['dtype'], values['data'])
            if values['dtype'] == 'basemodel':
                if isinstance(values['data'], dict):
                    values['data'] = cls.class_options[values['data']['class_name']].model_validate(values['data'])
        # add the class name to the values
        values['class_name'] = cls.__name__
        return values

    def __hash__(self):
        return hash(self.data)