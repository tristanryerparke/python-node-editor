
from pydantic import BaseModel, Field, model_validator, model_serializer, computed_field
from typing import Literal, ClassVar, Any, Union, List, Callable
import uuid
from io import BytesIO
import base64
import sys
import numpy as np
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.datatypes.field import InputNodeField, OutputNodeField
from backend.datatypes.field_data import FieldData
from backend.datatypes.base_node import BaseNode, node_definition
from backend.datatypes.field_data_utils import field_data_serlialization_prep

def test_inside_node():
    '''tests the field data and base node classes when used inside a node'''

    class AddNode(BaseNode):
        '''Basic node that adds two numbers'''
        @classmethod
        @node_definition(
            inputs=[
                InputNodeField(dtype='number', label='a',
                               data=FieldData(payload=1, dtype='number')),
                InputNodeField(dtype='number', label='b',
                               data=FieldData(payload=2, dtype='number'))
            ],
            outputs=[
                OutputNodeField(dtype='number', label='result')
            ]
        )
        def exec(cls, a: FieldData, b: FieldData) -> FieldData:
            result = a.payload + b.payload
            return FieldData(payload=result, dtype='number')
    
    # this is needed to simulate the node being imported dynamically
    AddNode.definition_path = sys.modules[AddNode.__module__].__file__

    a = AddNode()
    a.meta_exec()

    # check the result
    assert a.data.outputs[0].data.payload == 3


# test_on_node()

def test_cache_large_data():
    from devtools import debug as d
    from PIL import Image
    image = Image.open('tests/materials/monkey_1mb.png')

    # create a large data field locally as if an image was uploaded
    lg_datafield = FieldData(
        payload=np.array(image),
        dtype='numpy'
    )
    sm_datafield = FieldData(
        payload=1,
        dtype='number'
    )

    assert lg_datafield.cached == True
    assert sm_datafield.cached == False

    # pretend we are sending the data to the frontend after uploading an image
    lg_json = lg_datafield.model_dump_json()
    sm_json = sm_datafield.model_dump_json()
    
    # make sure the preview is in the json for large data
    lg_datafield_json_loaded = json.loads(lg_json)
    sm_datafield_json_loaded = json.loads(sm_json)
    assert lg_datafield_json_loaded['metadata'].get('preview') is not None
    assert sm_datafield_json_loaded['metadata'].get('preview') is None
    
    # pretend we are receiving that data from the frontend
    lg_datafield_from_json = FieldData.model_validate_json(lg_json)
    sm_datafield_from_json = FieldData.model_validate_json(sm_json)

    # make sure the payload is the same
    assert np.array_equal(lg_datafield_from_json.payload, lg_datafield.payload)
    assert np.array_equal(sm_datafield_from_json.payload, sm_datafield.payload)

    # make sure the cached flag is the same
    assert lg_datafield_from_json.cached == True
    assert sm_datafield_from_json.cached == False

# test_cache_large_data()


def test_data_from_frontend():
    from PIL import Image

    def test_validate_frontend_dicts(field_data_dict, initial_data):
        field_data = FieldData.model_validate(field_data_dict)
        assert np.array_equal(field_data.payload, initial_data)

        return field_data

    # these objects "came from the frontend" they include an extra field for testing cache function
    # in the future we just need to make sure the frontend is sending data that 
    # matches the format which comes out of field_data_serlialization_prep()
    field_dict_number = {
        'id': str(uuid.uuid4()),
        'raw_payload': 1,
        'dtype': 'number',
        'should_be_cached': False
    }
    field_dict_string = {
        'id': str(uuid.uuid4()),
        'raw_payload': 'hello',
        'dtype': 'string',
        'should_be_cached': False
    }
    field_dict_numpy = {
        'id': str(uuid.uuid4()),
        'raw_payload': np.array([1,2,3]),
        'dtype': 'numpy',
        'should_be_cached': False
    }
    field_dict_image = {
        'id': str(uuid.uuid4()),
        'raw_payload': np.array(Image.open('tests/materials/monkey_1mb.png')),
        'dtype': 'image',
        'should_be_cached': True
    }

    test_dicts = [
        field_dict_number,
        field_dict_string,
        field_dict_numpy,
        field_dict_image
    ]

    for test_dict in test_dicts:
        # make a dict that is valid for initializing a FieldData object
        # we can then compare the 'raw_payload' to the 'payload' after validation

        dict_w_serialized_payload = test_dict.copy()
        dict_w_serialized_payload['payload'] = field_data_serlialization_prep(dict_w_serialized_payload['dtype'], dict_w_serialized_payload['raw_payload'])
        field_data = test_validate_frontend_dicts(dict_w_serialized_payload, test_dict['raw_payload'])

        # for large data, cached should be true
        assert field_data.cached == test_dict['should_be_cached']

        # load the serialized data as a dict and check for preview
        serialized_field_data = field_data.model_dump_json()
        serialized_field_data_dict = json.loads(serialized_field_data)
        if test_dict['should_be_cached']:
            assert serialized_field_data_dict['metadata'].get('preview') is not None
        else:
            assert serialized_field_data_dict['metadata'].get('preview') is None


        


# test_data_from_frontend()
