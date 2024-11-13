from pydantic import BaseModel, Field
from typing import Union, Literal
import uuid

from .field_data import FieldData

class InputNodeField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'object']
    data: Union[FieldData, None] = None
    label: str
    description: str | None = None
    user_label: str = ''
    disabled: bool = False
    is_edge_connected: bool = False
    node_expanded: bool = False
    inspector_expanded: bool = True
    metadata: dict = {}


class OutputNodeField(InputNodeField):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dtype: Literal['number', 'string', 'json', 'numpy', 'image', 'object']
    data: Union[FieldData, None] = None
    label: str
    description: str | None = None
    user_label: str = ''
    disabled: bool = False
    is_edge_connected: bool = False
    node_expanded: bool = False
    inspector_expanded: bool = True
    metadata: dict = {}
