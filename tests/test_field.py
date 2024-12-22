from devtools import debug as d

from pne_backend.datatypes.basic import IntData, FloatData, StringData
from pne_backend.field import (
    dynamic_datatype_load, 
    InputNodeField, 
    ModelNotFoundError
)
from pne_backend.datatypes.compound import ListData
from pne_backend.datatypes.image import ImageData, image_to_base64
from pne_backend.base_data import SendableDataModel
from PIL import Image
import sys
import numpy as np

DATATYPE_REGISTRY = dynamic_datatype_load('pne_backend.datatypes')
InputNodeField.datatype_registry = DATATYPE_REGISTRY

# hack to be able to run the test without pytest
running_under_pytest = 'pytest' in sys.modules
if running_under_pytest:
    from tests.custom_types.custom_types_1 import CustomData3
else:
    from custom_types.custom_types_1 import CustomData3

def test_class_not_in_registry():
    field_dict = {
        'label': 'custom_data',
        'dtype': 'json',
        'data': {'class_name': 'CustomData4'}
    }
    try:
        field = InputNodeField.model_validate(field_dict)
    except ModelNotFoundError as e:
        pass

# test_class_not_in_registry()

def test_list_of_data():

    # ensure that listdata has a datatype dictionary to infer types from
    ListData.datatype_registry = DATATYPE_REGISTRY

    data_list_dict = {
        'class_name': 'ListData',
        'data': [
            IntData(payload=1).model_dump(), 
            FloatData(payload=2).model_dump()
        ]
    }

    field_dict = {
        'label': 'data_list',
        'dtype': 'json',
        'payload': data_list_dict
    }

    field = InputNodeField.model_validate(field_dict)

    d(field)

# test_list_of_data()

def test_dynamic_datatype_load():
    # hack to be able to run the test without pytest
    if running_under_pytest:
        module_path = 'tests.custom_types'
    else:
        module_path = 'custom_types'

    DATATYPE_REGISTRY.update(dynamic_datatype_load(module_path))

    assert CustomData3 in DATATYPE_REGISTRY.values()

    custom_data_dict = {
        'class_name': 'CustomData3',
        'a': IntData(payload=1).model_dump(),
        'b': FloatData(payload=2.0).model_dump(),
        'c': StringData(payload='world').model_dump()
    }

    field_dict = {
        'label': 'custom_data',
        'dtype': 'json',
        'data': custom_data_dict
    }

    field = InputNodeField.model_validate(field_dict)

    d(field)

    # assert isinstance(field.data, CustomData3)


# test_dynamic_datatype_load()


def test_image_data_from_frontend():
    image = Image.open('tests/materials/monkey_1mb.png')
    image_base64 = image_to_base64(image)
    d(image_base64[:100])

    data_json = {
        'class_name': 'ImageData',
        'payload': image_base64
    }

    field_dict = {
        'label': 'image',
        'dtype': 'image',
        'data': data_json
    }

    field = InputNodeField.model_validate(field_dict)

    d(type(field.data))

test_image_data_from_frontend()

def test_document_from_frontend():
    
    class Document(SendableDataModel):
        image: ImageData
        width_mm: FloatData
        height_mm: FloatData

    DATATYPE_REGISTRY.update({'Document': Document})
    
    image = Image.open('tests/materials/monkey_1mb.png')
    shape = np.array(image).shape
    image_base64 = image_to_base64(image)

    doc_dict = {
        'class_name': 'Document',
        'image': {'payload': image_base64},
        'width_mm': {'payload': 210},
        'height_mm': {'payload': 297}
    }

    field_dict = {
        'label': 'document',
        'dtype': 'json',
        'data': doc_dict
    }

    field = InputNodeField.model_validate(field_dict)

    d(field)

    assert isinstance(field.data.image.payload, np.ndarray)
    assert np.array_equal(field.data.image.payload.shape, shape)
    assert field.data.width_mm.payload == 210
    assert field.data.height_mm.payload == 297

# test_document_from_frontend()

    

