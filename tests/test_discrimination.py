from typing import Any, List, Union, Type, Dict
from pydantic import BaseModel, Field, computed_field, model_validator, model_serializer, field_validator
from devtools import debug as d
import numpy as np
from pne_backend.datatypes.basic import IntData, FloatData, StringData
from pne_backend.datatypes.image import ImageData
from pne_backend.datatypes.compound import ListData
from pne_backend.base_data import register_class, CLASS_REGISTRY

# class BaseData(BaseModel):
#     payload: Any

#     @computed_field(repr=False)
#     @property
#     def class_name(self) -> str:
#         return self.__class__.__name__

#     def __init__(self, payload: Any = None, **data):
#         if payload is not None and not isinstance(payload, dict):
#             super().__init__(payload=payload)
#         else:
#             super().__init__(**data)

#     @model_validator(mode='before')
#     @classmethod
#     def validate_payload(cls, input_values, val_info):
#         if val_info.mode == 'json':
#             return input_values
#         elif isinstance(input_values, dict):
#             return input_values
#         else:
#             return {'payload': input_values}
        
#     @model_serializer()
#     def serialize(self):
#         self_as_dict = {k: getattr(self, k) for k in self.model_computed_fields}
#         self_as_dict |= self.__dict__.copy()
#         return self_as_dict

# def test_two_init_methods():
#     b_py= BaseData(payload=1)
#     d(b_py)
#     b_json = BaseData.model_validate_json('{"payload": 1}')
#     d(b_json)

# # test_two_init_methods()

# CLASS_REGISTRY: Dict[str, Type[BaseModel]] = {}

# def register_class(cls: Type[BaseModel]):
#     CLASS_REGISTRY[cls.__name__] = cls
#     return cls

# # Use the decorator to register classes
# @register_class
# class IntData(BaseData):
#     payload: int

# @register_class
# class FloatData(BaseData):
#     payload: float

# @register_class
# class StringData(BaseData):
#     payload: str

# @register_class
# class ListData(BaseData):
#     payload: List[Any] = Field(discriminator='class_name')

#     @field_validator('payload', mode='before')
#     @classmethod
#     def validate_payload(cls, value):
#         if isinstance(value, list):
#             new_list = []
#             for item in value:
#                 if isinstance(item, dict):
#                     class_parent = item.get('class_parent')
#                     class_name = item.get('class_name')
#                     # Prioritize class_parent if available
#                     discriminator = class_parent or class_name
#                     if discriminator and discriminator in CLASS_REGISTRY:
#                         item_class = CLASS_REGISTRY[discriminator]
#                         new_item = item_class.model_validate(item)
#                         new_list.append(new_item)
#                     else:
#                         new_list.append(item)
#                 else:
#                     new_list.append(item)
#             return new_list
#         return value
    

def test_list_data():
    l_py = ListData(payload=[IntData(payload=1), FloatData(payload=2.0), IntData(payload=3)])
    d(l_py)
    
    l_json = l_py.model_dump_json()
    d(l_json)
    l_reconstructed = ListData.model_validate_json(l_json)
    d(l_reconstructed)

# test_list_data()


def test_nested_list_data():
    l_py = ListData(payload=[
        IntData(payload=1),
        FloatData(payload=2.0),
        ListData(payload=[
            StringData(payload="hello"),
            StringData(payload="world")
        ])
    ])
    d(l_py)
    l_json=l_py.model_dump_json()
    d(l_json)
    l_reconstructed = ListData.model_validate_json(l_json)
    d(l_reconstructed)

# test_nested_list_data()

class ModelData(BaseModel):
    '''Modeldata is subclassed to allow creation of classes that can be serialized and deserialized'''
    class_parent: str = 'ModelData'

    @computed_field(repr=True)
    @property
    def class_name(self) -> str:
        return self.__class__.__name__

    @model_serializer()
    def serialize(self):
        self_as_dict = {k: getattr(self, k) for k in self.model_computed_fields}
        self_as_dict |= self.__dict__.copy()
        return self_as_dict

# Register subclasses of ModelData
@register_class
class Document(ModelData):
    image: StringData
    width: FloatData
    height: FloatData
    units: StringData


def test_model_data():

    doc = Document(
        image= ImageData(payload=np.zeros((100, 100, 3))),
        width= FloatData(payload=10),
        height= FloatData(payload=10),
        units= StringData(payload='mm')
    )

    d(doc)
    doc_json = doc.model_dump_json(indent=4)
    d(doc_json)

    doc_reconstructed  = Document.model_validate_json(doc_json)
    d(doc_reconstructed)

test_model_data()

@register_class
class Recipe(ModelData):
    ingredients: ListData
    time_to_cook: FloatData


rec1 = Recipe(
    ingredients=ListData(payload=[
        StringData(payload='sugar'),
        StringData(payload='butter')
    ]),
    time_to_cook=FloatData(payload=10)
)

def test_model_with_list_inside():

    d(rec1)
    rec_json = rec1.model_dump_json(indent=4)
    d(rec_json)

    rec1_reconstructed  = Recipe.model_validate_json(rec_json)
    d(rec1_reconstructed)

# test_model_with_list_inside()

rec2 = Recipe(
    ingredients=ListData(payload=[
        StringData(payload='flour'),
        StringData(payload='eggs')
    ]),
    time_to_cook=FloatData(payload=10)
)

def test_list_with_model_data_inside():
    meal_plan = ListData(payload=[
        rec1,
        rec2
    ])

    d(meal_plan)
    meal_plan_json = meal_plan.model_dump_json(indent=4)
    d(meal_plan_json)

    meal_plan_reconstructed = ListData.model_validate_json(meal_plan_json)
    d(meal_plan_reconstructed)

# test_list_with_model_data_inside()

@register_class
class Menu(ModelData):
    title: StringData
    test_number: IntData
    recipes: ListData
    preparation_time: FloatData
    notes: StringData

def test_nested_model_data():
    # Create a menu with multiple recipes
    menu = Menu(
        title=StringData(payload="Weekend Brunch"),
        test_number=IntData(payload=1),
        recipes=ListData(payload=[
            Recipe(
                ingredients=ListData(payload=[
                    StringData(payload="eggs"),
                    StringData(payload="milk"),
                    StringData(payload="flour")
                ]),
                time_to_cook=FloatData(payload=15.0)
            ),
            Recipe(
                ingredients=ListData(payload=[
                    StringData(payload="bread"),
                    StringData(payload="butter"),
                    StringData(payload="jam")
                ]),
                time_to_cook=FloatData(payload=5.0)
            )
        ]),
        preparation_time=FloatData(payload=30.0),
        notes=StringData(payload="Serve with fresh coffee")
    )

    d(menu)
    menu_json = menu.model_dump_json(indent=4)
    d(menu_json)

    menu_reconstructed = Menu.model_validate_json(menu_json)
    d(menu_reconstructed)

test_nested_model_data()

