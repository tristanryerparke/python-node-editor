from typing import Union, Any
from pydantic import BaseModel, ConfigDict, computed_field
from pydantic_core._pydantic_core import ValidationError
import json
import numpy as np

from devtools import debug as d
from PIL import Image
import io
import base64
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.datatypes.cachable_data import CachableData
from backend.datatypes.basic_data import IntData, FloatData, StringData, NumpyData

# set the max file size for caching to 50kb
CachableData.max_file_size_mb = 0.05

def test_invalid_payload():
    """Ensure that a CachableData instance with an invalid payload raises a error"""
    try:
        mf2 = CachableData(payload=None)
    except ValueError as e:
        print(e)
        return
    assert False

# test_invalid_payload()


def test_small_data():
    '''test that a small data does not get cached, 
    and that the full data is serialized and sent to the frontend'''

    small_data_instances = [
        IntData(payload=1),
        FloatData(payload=1.0),
        StringData(payload='hello'),
        NumpyData(payload=np.array([[1, 2, 3], [4, 5, 6]])),
    ]

    for data in small_data_instances:

        d_as_json = data.model_dump_json()
        d(json.loads(d_as_json))

        data_from_json = data.__class__.model_validate_json(d_as_json)

        assert data.id is None
        assert not data.cached
        assert data_from_json.preview is None

# test_small_data()


def test_large_data():
    '''test that a large data gets cached, and that serialized previews are sent to the frontend'''

    large_data_instances = [
        StringData(payload='hello'*100000),
        NumpyData(payload=np.random.rand(1000, 1000)),
    ]

    for data in large_data_instances:
        d(data)

        d_as_json = data.model_dump_json()
        d(json.loads(d_as_json))

        data_from_json = data.__class__.model_validate_json(d_as_json)

        assert data.id is not None
        assert data.cached
        assert data_from_json.preview is not None

# test_large_data()

def test_int_data_from_frontend():
    '''Test that an integer created in the frontend can be deserialized in the backend'''
    payload_int = 42
    json_def = {
        'class_name': 'IntData',
        'payload': payload_int
    }
    d(json_def)

    d_from_json = IntData.model_validate_json(json.dumps(json_def))
    d(d_from_json)

    assert payload_int == d_from_json.payload
    assert not d_from_json.cached

# test_int_data_from_frontend()


def test_float_data_from_frontend():
    '''Test that a float created in the frontend can be deserialized in the backend'''
    payload_float = 3.14159
    json_def = {
        'class_name': 'FloatData',
        'payload': payload_float
    }
    d(json_def)

    d_from_json = FloatData.model_validate_json(json.dumps(json_def))
    d(d_from_json)

    assert payload_float == d_from_json.payload
    assert not d_from_json.cached

# test_float_data_from_frontend()


def test_string_data_from_frontend():
    '''Test that a string created in the frontend can be deserialized in the backend'''
    payload_string = "Hello, World!"
    json_def = {
        'class_name': 'StringData',
        'payload': payload_string
    }
    d(json_def)

    d_from_json = StringData.model_validate_json(json.dumps(json_def))
    d(d_from_json)

    assert payload_string == d_from_json.payload
    assert not d_from_json.cached

# test_string_data_from_frontend()

def test_numpy_data_from_frontend():
    '''Test that a numpy array created as a list of lists in the frontend can be deserialized in the backend'''
    payload_array = np.array([[1, 2, 3], [4, 5, 6]])
    json_def = {
        'class_name': 'NumpyData',
        'payload': payload_array.tolist()
    }
    d(json_def)

    d_from_json = NumpyData.model_validate_json(json.dumps(json_def))
    d(d_from_json)

    assert np.array_equal(payload_array, d_from_json.payload)
    assert not d_from_json.cached

# test_numpy_data_from_frontend()


def test_small_nested_data():
    """Test that subclasses of of CachableData can be nested inside other classes
    and are correctly serialized and deserialized"""
    class NestedData(BaseModel):
        data1: NumpyData
        data2: StringData

    nested_data = NestedData(
        data1=NumpyData(payload=np.random.rand(5, 5)),
        data2=StringData(payload='hello')
    )
    d(nested_data)



    d_as_json = nested_data.model_dump_json()
    loaded = json.loads(d_as_json)
    d(loaded)

    assert 'preview' not in loaded['data1']
    assert 'preview' not in loaded['data2']

    d_from_json = NestedData.model_validate(loaded)

    assert np.array_equal(nested_data.data1.payload, d_from_json.data1.payload)
    assert nested_data.data2.payload == d_from_json.data2.payload
    assert d_from_json.data1.cached == False 
    assert d_from_json.data2.cached == False

# test_small_nested_data()


def test_large_nested_data():
    """Test that subclasses of of CachableData with large payloads can be nested inside other classes
    and are correctly serialized and deserialized"""
    class NestedData(BaseModel):
        data1: NumpyData
        data2: StringData

    nested_data = NestedData(
        data1=NumpyData(payload=np.random.rand(1000, 1000)),
        data2=StringData(payload='hello'*100000)
    )

    d(nested_data)

    d_as_json = nested_data.model_dump_json()

    loaded = json.loads(d_as_json)
    d(loaded)

    assert loaded['data1']['preview'] is not None
    assert loaded['data2']['preview'] is not None

    d_from_json = NestedData.model_validate(loaded)

    assert np.array_equal(nested_data.data1.payload, d_from_json.data1.payload)
    assert nested_data.data2.payload == d_from_json.data2.payload
    assert d_from_json.data1.cached == True
    assert d_from_json.data2.cached == True

# test_large_nested_data()


def test_infer_subclass():
    """Test that a specific subclass of CachableData can be inferred from the frontend"""
    
    class NestedData2(BaseModel):
        data_flex_1: Union[FloatData, StringData]
        data_flex_2: Union[FloatData, StringData]

    data_json_1 = {
        'data_flex_1': {
            # 'class_name': 'StringData',
            'payload': 'hello'
        },
        'data_flex_2': {
            # 'class_name': 'FloatData',
            'payload': 1.0
        }
    }

    data_json_2 = {
        'data_flex_1': {
            'class_name': 'FloatData',
            'payload': 1.0
        },
        'data_flex_2': {
            'class_name': 'StringData',
            'payload': 'hello'
        }
    }

    instance = NestedData2.model_validate(data_json_1)

    print(instance.data_flex_1)
    print(instance.data_flex_2)

    assert isinstance(instance.data_flex_1, StringData)
    assert isinstance(instance.data_flex_2, FloatData)

    instance = NestedData2.model_validate(data_json_2)
    assert isinstance(instance.data_flex_1, FloatData)
    assert isinstance(instance.data_flex_2, StringData)

test_infer_subclass()


