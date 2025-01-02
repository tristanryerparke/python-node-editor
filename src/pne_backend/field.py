from pydantic import BaseModel, Field, model_validator
from typing import Literal, Any, ClassVar, Union, Optional
import uuid
import importlib
import inspect
import pkgutil
import importlib.util
from pathlib import Path

from .base_data import SendableDataModel, BaseData

class ModelNotFoundError(Exception):
    pass


def instantiate_data_class(data_dict: dict, registry: dict) -> Any:
    """Instantiate a class from a dictionary using the provided registry"""
    if 'class_name' in data_dict:
        class_type = data_dict['class_name']
        if class_type in registry:
            return registry[class_type].model_validate(data_dict)
        raise ModelNotFoundError(f"Class {class_type} not found in registry")
    return data_dict


def dynamic_datatype_load(
        module_path: str, 
        search_base_class: type = SendableDataModel,
        exclude_classes: list[type] = [BaseData]
    ) -> dict:
    '''load all data matching classes from a module path'''
    class_registry = {}

    # Get the actual filesystem path
    spec = importlib.util.find_spec(module_path)
    if spec is None:
        return class_registry

    # Iterate through all modules in the package
    for module_info in pkgutil.iter_modules([spec.submodule_search_locations[0]]):
        if not module_info.name.startswith('_'):
            # print(f"importing {module_info.name}")s
            module = importlib.import_module(
                f"{module_path}.{module_info.name}")
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if inspect.isclass(attr) and issubclass(attr, search_base_class) and attr is not search_base_class:
                    if attr not in exclude_classes:
                        class_registry[attr.__name__] = attr

    return class_registry


# DATATYPE_REGISTRY = dynamic_datatype_load('pne_backend.datatypes', BaseData)
DATATYPE_REGISTRY = {}


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

    datatype_registry: ClassVar[dict] = DATATYPE_REGISTRY

    @model_validator(mode='before')
    @classmethod
    def validate_data(cls, input_dict):
        """Pick the data class to instantiate by the finding the class_name in the DATATYPE_REGISTRY"""
        if 'data' in input_dict:
            if input_dict['data'] is not None:
                input_dict['data'] = instantiate_data_class(input_dict['data'], cls.datatype_registry)
        return input_dict


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
