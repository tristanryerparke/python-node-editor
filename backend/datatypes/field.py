from pydantic import BaseModel, Field
from typing import Union, Literal
import uuid

from .field_data import FieldData


class InputNodeField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'object']
    data: Union[FieldData, None] = None
    label: str
    user_label: str = ''
    is_edge_connected: bool = False


class OutputNodeField(InputNodeField):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'object']
    data: Union[FieldData, None] = None
    label: str
    user_label: str = ''
    is_edge_connected: bool = False