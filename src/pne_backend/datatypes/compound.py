from typing import List, ClassVar, Union, Dict, ForwardRef, Literal, Type, Any
from pydantic import BaseModel, Field, model_validator, field_validator, computed_field, model_serializer
import uuid
from ..base_data import BaseData, register_class, CLASS_REGISTRY
from devtools import debug as d

@register_class
class ListData(BaseData):
    payload: List[Any] = Field(discriminator='class_name')

    @field_validator('payload', mode='before')
    @classmethod
    def validate_payload(cls, value):
        if isinstance(value, list):
            new_list = []
            for item in value:
                if isinstance(item, dict):
                    class_parent = item.get('class_parent')
                    class_name = item.get('class_name')
                    # Prioritize class_parent if available
                    discriminator = class_parent or class_name
                    if discriminator and discriminator in CLASS_REGISTRY:
                        item_class = CLASS_REGISTRY[discriminator]
                        new_item = item_class.model_validate(item)
                        new_list.append(new_item)
                    else:
                        new_list.append(item)
                else:
                    new_list.append(item)
            return new_list
        return value

class ModelData(BaseModel):
    '''Modeldata is subclassed to allow creation of classes that can be serialized and deserialized'''
    class_parent: str = 'ModelData'

    @computed_field(repr=True)
    @property
    def class_name(self) -> str:
        return self.__class__.__name__

    @model_serializer
    def serialize(self):
        self_as_dict = {k: getattr(self, k) for k in self.model_computed_fields}
        self_as_dict |= self.__dict__.copy()
        return self_as_dict
