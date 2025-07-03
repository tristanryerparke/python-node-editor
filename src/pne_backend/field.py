from pydantic import BaseModel, Field, model_validator, ValidationInfo
from typing import Literal, Any, ClassVar, Union, Optional, List
import uuid
import importlib
import inspect
import pkgutil
import importlib.util
from pathlib import Path

<<<<<<< Updated upstream
from .base_data import BaseData
from .datatypes.compound import CLASS_REGISTRY
=======
from .datatypes.compound import DATA_CLASS_REGISTRY
>>>>>>> Stashed changes

class ModelNotFoundError(Exception):
    pass


class InputNodeField(BaseModel):
    data: Optional[Any] = None
    allowed_types: list[str] = ['AnyData']
    display_type: Optional[str] = None
    label: str
    description: Optional[str] = None
    user_label: Optional[str] = None
    # disabled: bool = False
    is_edge_connected: bool = False
    # node_expanded: bool = False
    # inspector_expanded: bool = True
    metadata: dict = {'expanded': False}

    @model_validator(mode='before')
    @classmethod
    def validate_data(cls, values, info: ValidationInfo):
        allowed = values.get('allowed_types', ['AnyData'])
        if allowed == ['AnyData']:
            allowed_classes = list(DATA_CLASS_REGISTRY.keys())
        else:
            allowed_classes = allowed
        
        data = values.get('data')
        if isinstance(data, dict):
            discriminator = data.get('class_name')
            if discriminator in allowed_classes:
                data_class = DATA_CLASS_REGISTRY.get(discriminator)
                if data_class:
                    values['data'] = data_class.model_validate(data, context={'state': 'deserializing'})
                else:
                    raise ValueError(f"Discriminator '{discriminator}' not found in DATA_CLASS_REGISTRY.")
            else:
                raise ValueError(f"Type '{discriminator}' is not allowed. Allowed types: {allowed_classes}.")
        return values



class OutputNodeField(BaseModel):
    data: Optional[Any] = None
    label: str
    allowed_types: list[str] = ['AnyData']
    description: Optional[str] = None
    user_label: Optional[str] = None
    
    # disabled: bool = False
    is_edge_connected: bool = False
    # node_expanded: bool = False
    # inspector_expanded: bool = True
    metadata: dict = {}
