
from pydantic import BaseModel, Field, model_validator, model_serializer, computed_field
from typing import Any, Literal, ClassVar
import uuid
import json

from backend.datatypes.field_data_utils import (
    field_data_serlialization_prep,
    field_data_deserilaization_prep,
    LARGE_DATA_CACHE,
    create_thumbnail,
    truncate_repr
)



class FieldData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payload: Any
    metadata: dict = Field(default_factory=lambda: {})
    # cached: bool = False
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'object']

    max_file_size_mb: ClassVar[float] = 0.1

    @model_validator(mode='before')
    @classmethod
    def validate_payload(cls, data):
        '''if the data is cached (id is in the cache), retrieve it from the cache'''
        id = data.get('id')
        if id and id in LARGE_DATA_CACHE:
            data['payload'] = field_data_deserilaization_prep(
                LARGE_DATA_CACHE[id]['dtype'],
                LARGE_DATA_CACHE[id]['payload']
            )
        # otherwise, we just deserialize the data
        else:
            data['payload'] = field_data_deserilaization_prep(
                data['dtype'],
                data['payload']
            )

        return data

    @model_serializer()
    def serialize_payload(self):
        '''prep the data for sending to the frontend in json form
        if the data is too big, we cache it and send a thumbnail or truncated repr instead
        '''
        data = self.__dict__.copy()
        if self.cached:
            LARGE_DATA_CACHE[self.id] = {'dtype': self.dtype, 'payload': self.payload}
            data['payload'] = None
            if self.dtype == 'image':
                data['metadata']['preview'] = create_thumbnail(
                    self.payload, self.max_file_size_mb)
            else:
                data['metadata']['preview'] = truncate_repr(self.payload)
        else:
            data['payload'] = field_data_serlialization_prep(
                self.dtype, self.payload)
        return data

    @computed_field(alias='cached', title='Flag for large data cached in db', repr=True)
    @property
    def cached(self) -> bool:
        '''for large data we need to cache, 
        this checks the size and assigns the cached flag if data is too large'''
        if self.size_mb >= self.max_file_size_mb:
            return True
        else:
            return False

    @computed_field(alias='size_mb', title='Size in Megabytes', repr=True)
    @property
    def size_mb(self) -> float:
        '''calculates an attribute for the data size in megabytes'''
        if isinstance(self.payload, type(None)):
            return 0

        if self.dtype == 'json' or self.dtype == 'string' or self.dtype == 'number':
            json_data = json.dumps(self.payload)
            size = len(json_data.encode('utf-8'))
        elif self.dtype == 'numpy' or self.dtype == 'image':
            size = self.payload.nbytes
        elif self.dtype == 'basemodel':
            size = len(json.dumps(self.payload.model_dump()).encode('utf-8'))
        else:
            raise TypeError(f'Invalid dtype: {self.dtype}')

        return size / (1024 * 1024)

FieldData.max_file_size_mb = 0.1