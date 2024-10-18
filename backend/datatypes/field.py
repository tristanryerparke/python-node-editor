import uuid
import json
from typing import Any, Union, Literal, ClassVar, FrozenSet, Tuple, Dict
import numpy as np
from devtools import debug as d

from pydantic import (
    BaseModel,
    ConfigDict,
    Field as PydanticField,
    computed_field,
    field_serializer,
    model_validator,
    model_serializer,
)

from .field_data_utils import (
    truncate_repr,
    field_data_serlialization_prep,
    field_data_deserilaization_prep,
    create_thumbnail,
    LARGE_DATA_CACHE,
)

MAX_FILE_SIZE_MB = 0.1


class NodeField(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, debug=True)

    id: str = PydanticField(default_factory=lambda: str(uuid.uuid4())) # id is for retrieving large data from the db
    field_type: Literal['input', 'output'] = 'input'
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'basemodel'] # dtype helps us know how to save, load, serialize, deserialize
    data: Any = None # front facing data attribute / preview
    metadata: Dict[str, Any] = {}  # Additional metadata for the field
    max_file_size_mb: float = PydanticField(default=MAX_FILE_SIZE_MB)
    # class_name: str
    label: str
    user_label: str = ''

    class_options: ClassVar[dict] = {}


    @field_serializer('data')
    def serialize_data(self, data: Any, _info: Any) -> Any:
        '''return a truncated repr of the data if big (cached), otherwise return the data'''

        if self.cached:
            LARGE_DATA_CACHE[self.id] = {'dtype':self.dtype, 'data': data}
            print(f"Stored data in LARGE_DATA_CACHE for id: {self.id}")
            if self.dtype == 'image':
                return create_thumbnail(data, self.max_file_size_mb)
            else:
                return truncate_repr(data)
        else:
            return field_data_serlialization_prep(self.dtype, data)
    
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

        # Pull the data from cache
        if values.get('cached', False) == True:
            if values['id'] in LARGE_DATA_CACHE:
                print(f'pulling data from cache for {values["id"]}')
                values['data'] = LARGE_DATA_CACHE[values['id']]['data']

        else:
            # We are getting new data
            if values.get('data', None) is not None:
                values['data'] = field_data_deserilaization_prep(values['dtype'], values['data'])
                
                # Create image metadata
                if values['dtype'] == 'image':
                    if 'metadata' not in values:
                        values['metadata'] = {}
                    values['metadata']['width'] = values['data'].shape[1]
                    values['metadata']['height'] = values['data'].shape[0]
                    values['metadata']['channels'] = values['data'].shape[2] if values['data'].ndim == 3 else 1
                
                # Instantiate a class if it is in the options
                if values['dtype'] == 'basemodel':
                    if isinstance(values['data'], dict):
                        values['data'] = cls.class_options[values['data']['class_name']].model_validate(values['data'])
        
        # Update class name and label
        values['class_name'] = cls.__name__
        if values.get('user_label', None) is None:
            values['user_label'] = values['label']

        return values
    

    def __hash__(self):
        return hash(self.data)
