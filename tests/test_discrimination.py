from typing import Any, List, Union, Type, Dict
from pydantic import BaseModel, Field, computed_field, model_validator, model_serializer, field_validator
from devtools import debug as d
import numpy as np
from pne_backend.datatypes.basic import IntData, FloatData, StringData
from pne_backend.datatypes.image import ImageData
from pne_backend.datatypes.compound import ListData, ModelData
from pne_backend.base_data import register_class, DATA_CLASS_REGISTRY



def test_list_data():
    l_py = ListData(payload=[IntData(payload=1), FloatData(payload=2.0), IntData(payload=3)])
    d(l_py)
    
    l_json = l_py.model_dump_json()
    d(l_json)
    l_reconstructed = ListData.model_validate_json(l_json)
    d(l_reconstructed)

test_list_data()


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

# Register subclasses of ModelData
@register_class
class Document(ModelData):
    image: ImageData
    width: FloatData
    height: FloatData
    units: StringData


def test_model_data():

    image = ImageData(payload=np.zeros((100, 100, 3)))
    units = StringData(payload='mm')
    width = FloatData(payload=10)
    height = FloatData(payload=10)
    

    doc = Document(
        image=image,
        units=units,
        width=width,
        height=height,
    )

    d(doc)
    doc_json = doc.model_dump_json(indent=4)
    d(doc_json)

    doc_reconstructed  = Document.model_validate_json(doc_json)
    d(doc_reconstructed)

# test_model_data()

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

# test_nested_model_data()

