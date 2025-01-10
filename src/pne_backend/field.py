from pydantic import BaseModel, Field, model_validator
from typing import Literal, Any, ClassVar, Union, Optional
import uuid
import importlib
import inspect
import pkgutil
import importlib.util
from pathlib import Path

from .base_data import BaseData

class ModelNotFoundError(Exception):
    pass


class InputNodeField(BaseModel):
    # id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: Optional[Any] = None
    allowed_types: list[str] = []
    default_generator_type: Optional[str] = None
    display_type: Optional[str] = None
    label: str
    description: Optional[str] = None
    user_label: Optional[str] = None
    # disabled: bool = False
    is_edge_connected: bool = False
    # node_expanded: bool = False
    # inspector_expanded: bool = True
    metadata: dict = {}



class OutputNodeField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: Optional[Any] = None
    label: str
    description: Optional[str] = None
    user_label: Optional[str] = None
    # disabled: bool = False
    is_edge_connected: bool = False
    # node_expanded: bool = False
    # inspector_expanded: bool = True
    metadata: dict = {}
