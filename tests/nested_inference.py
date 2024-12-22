from typing import Any
from pydantic import BaseModel, model_validator
import importlib
import inspect
from devtools import debug as d
import os

from pne_backend.datatypes.basic import IntData, FloatData, StringData
from pne_backend.utils import NamedBaseModel

class CustomData1(NamedBaseModel):
    a: IntData
    b: StringData

class CustomData2(NamedBaseModel):
    a: FloatData
    b: StringData

DATATYPE_REGISTRY = {
    'IntData': IntData,
    'FloatData': FloatData,
    'StringData': StringData,
    'CustomData1': CustomData1,
    'CustomData2': CustomData2
}


class InputModel(BaseModel):
    data: Any


    @model_validator(mode='before')
    @classmethod
    def validate_data(cls, input_dict):
        if isinstance(input_dict, dict) and 'class_name' in input_dict:
            class_type = input_dict['class_name']
            input_dict['data'] = DATATYPE_REGISTRY[class_type].model_validate(input_dict)
        return input_dict

def test_with_custom_data():

    im_dict = {
        'class_name': 'CustomData1',
        'a': IntData(payload=1).model_dump(),
        'b': StringData(payload='hello').model_dump()
    }

    im = InputModel.model_validate(im_dict)

    assert isinstance(im.data, CustomData1)
    assert im.data.a.payload == 1
    assert im.data.b.payload == 'hello'

# test_with_custom_data()

def test_with_int_data():
    im_dict = {
        'class_name': 'IntData',
        'payload': 1
    }

    im = InputModel.model_validate(im_dict)

    assert isinstance(im.data, IntData)
    assert im.data.payload == 1

# test_with_int_data()

def test_dynamic_import():
    from custom_types.custom_types_1 import CustomData3
    module_path = 'tests/custom_types'

    files = [f.split('.')[0] for f in os.listdir(module_path) if f.endswith('.py') and f != '__init__.py']

    print(files)

    

    # module = importlib.import_module(f'custom_types.{files[0]}')
    # for attr_name in dir(module):
    #     attr = getattr(module, attr_name)
    #     if inspect.isclass(attr) and issubclass(attr, NamedBaseModel) and attr is not NamedBaseModel:
    #         DATATYPE_REGISTRY[attr.__name__] = attr

    # im_dict = {
    #     'class_name': 'CustomData3',
    #     'a': IntData(payload=1).model_dump(),
    #     'b': FloatData(payload=2.0).model_dump(),
    #     'c': StringData(payload='world').model_dump()
    # }

    # im = InputModel.model_validate(im_dict)

    # assert isinstance(im.data, CustomData3)

test_dynamic_import()

    




