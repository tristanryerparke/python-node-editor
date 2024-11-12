# add backend to the system path
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


import json
import numpy as np
from PIL import Image
from pydantic import (
    BaseModel,
    ConfigDict,
    model_validator,
    field_validator,
    field_serializer,
)
from devtools import debug as d


from backend.datatypes.field import NodeField
from backend.datatypes.field_data_utils import get_string_size_mb, image_to_base64, base64_to_image


def test_serialize_and_deserialize():
    '''tests that a large data payload can be serialized and deserialized correctly, 
    and the respective previews are generated'''
    MAX_SIZE = 0.1

    # create two data instances, one large and one small
    large_data = NodeField(
        label='Large Data',
        dtype='json',
        data='AAA'*100000,
        max_file_size_mb=MAX_SIZE
    )
    small_data = NodeField(
        label='Small Data',
        dtype='json',
        data='BBB',
        max_file_size_mb=MAX_SIZE
    )

    # cached should be true for large data, false for small data
    assert large_data.cached == True
    assert small_data.cached == False

    props_concentated = large_data.data + small_data.data

    large_data_json = large_data.model_dump_json()
    small_data_json = small_data.model_dump_json()

    # check that the size of the json string is within the max size too
    assert get_string_size_mb(large_data_json) <= MAX_SIZE
    assert get_string_size_mb(small_data_json) <= MAX_SIZE

    # this simulates the dict style state of data in the frontend
    large_data_serialized_dict = json.loads(large_data_json)
    small_data_serialized_dict = json.loads(small_data_json)

    # large data should be a preview not the full data, small data should be complete
    assert large_data_serialized_dict['data'] != large_data.data
    assert '...' in large_data_serialized_dict['data']
    assert not '...' in small_data_serialized_dict['data']

    large_data_deserialized = NodeField.model_validate_json(large_data_json)
    small_data_deserialized = NodeField.model_validate_json(small_data_json)

    # after deserialization, both cached and un-cached data should be complete
    assert large_data_deserialized.data == large_data.data
    assert small_data_deserialized.data == small_data.data
    assert large_data_deserialized.size_mb == large_data.size_mb
    assert small_data_deserialized.size_mb == small_data.size_mb

    props_concentated_re = large_data_deserialized.data + small_data_deserialized.data

    # the concatenation of the two data after ser/de-ser should be the same as the original
    assert props_concentated_re == props_concentated


def test_different_basic_data_types():
    '''tests that different basic data types (large and small) can be serialized
    and deserialized correctly'''
    MAX_SIZE = 0.1

    small_data_inst_with_different_types = [
        # small data
        NodeField(label='String', dtype='json', data='this is some test string data',
             max_file_size_mb=MAX_SIZE),  # string
        NodeField(label='Int', dtype='json', data=1234567890, max_file_size_mb=MAX_SIZE),  # int
        NodeField(label='Float', dtype='json', data=123.456, max_file_size_mb=MAX_SIZE),  # float
        NodeField(label='Bool', dtype='json', data=True, max_file_size_mb=MAX_SIZE),  # bool
        NodeField(label='None', dtype='json', data=None, max_file_size_mb=MAX_SIZE),  # None
        NodeField(label='List of Ints', dtype='json', data=[1, 2],
             max_file_size_mb=MAX_SIZE),  # list of ints
        NodeField(label='Dict with Ints', dtype='json', data={'a': 1, 'b': 2},
             max_file_size_mb=MAX_SIZE),  # dict with ints
        # nested list with differing data
        NodeField(label='Nested List', dtype='json', data=[['a', 'b'], 2], max_file_size_mb=MAX_SIZE),
    ]

    # serialize and deserialize each
    for di in small_data_inst_with_different_types:

        # check is small
        assert di.cached == False

        di_json = di.model_dump_json()

        # check that the size of the json string is within the max size too
        assert get_string_size_mb(di_json) <= MAX_SIZE

        di_deserialized = NodeField.model_validate_json(di_json)

        # check that the data was not disturbed
        assert di.data == di_deserialized.data

    large_data_inst_with_different_types = [
        # nested list with differing data
        NodeField(label='Large Nested List', dtype='json', data=[['a', 'b'] * \
             100000, 2], max_file_size_mb=MAX_SIZE),
        # nested list with differing data
        NodeField(label='Large Nested List with Dict', dtype='json', data=[
             ['a', {'b': 20}] * 100000, None], max_file_size_mb=MAX_SIZE),
    ]

    # serialize and deserialize each
    for di in large_data_inst_with_different_types:

        # check is large
        assert di.cached == True

        di_json = di.model_dump_json()

        # check that the size of the json string is within the max size too
        assert get_string_size_mb(di_json) <= MAX_SIZE

        di_deserialized = NodeField.model_validate_json(di_json)

        # # check that the data was not disturbed
        assert di.data == di_deserialized.data


def test_as_if_coming_from_frontend():
    '''tests that a large data payload from the frontend is correctly deserialized, 
    cached and that a preview is generated when serializing'''

    data_from_frontend = json.dumps({
        'label': 'Large Data',
        'data': 'AAA'*1000000,
        'dtype': 'json'
    })

    datamodel = NodeField.model_validate_json(data_from_frontend)

    assert datamodel.cached == True

    # emulate sending back to frontend
    data_to_frontend = datamodel.model_dump_json()

    # check that data is a preview
    assert '...' in json.loads(data_to_frontend)['data']


def test_numpy():
    '''tests direct creation and ser/deser of numpy arrays'''
    max_size = 0.1

    small_numpy = NodeField(label='Small Numpy', dtype='numpy', data=np.ones((10, 10)))
    big_numpy = NodeField(label='Large Numpy', dtype='numpy', data=np.ones(
        (1000, 1000)), max_file_size_mb=max_size)

    assert small_numpy.cached == False
    assert big_numpy.cached == True

    small_numpy_json = small_numpy.model_dump_json()
    big_numpy_json = big_numpy.model_dump_json()

    # check that the size of the json string is within the max size too
    assert get_string_size_mb(small_numpy_json) <= max_size
    assert get_string_size_mb(big_numpy_json) <= max_size

    small_numpy_deserialized = NodeField.model_validate_json(small_numpy_json)
    big_numpy_deserialized = NodeField.model_validate_json(big_numpy_json)

    # check that the data was not disturbed
    assert small_numpy.data.all() == small_numpy_deserialized.data.all()
    assert big_numpy.data.all() == big_numpy_deserialized.data.all()


def test_numpy_from_frontend():
    '''simulates recieving a small numpy array from the frontend'''

    data_from_frontend = '''{
        "label": "Small Numpy",
        "data" : "[[1,2,3],[4,5,6]]",
        "dtype" : "numpy"
    }'''

    datamodel = NodeField.model_validate_json(data_from_frontend)

    assert datamodel.cached == False
    assert type(datamodel.data) == np.ndarray


def test_image():
    '''test that image types are serialized and deserialized correctly, and that 
    the thumbnail is created correctly'''
    import cv2
    max_size = 0.5

    small_img = np.array(Image.new('RGB', (100, 100), color=(255, 255, 255)))
    big_img = np.array(Image.open('tests/materials/monkey_1mb.png'))
    print(big_img.shape)

    small_image = NodeField(
        label='Small Image',
        dtype='image',
        data=small_img,
        max_file_size_mb=max_size
    )
    big_image = NodeField(
        label='Large Image',
        dtype='image',
        data=big_img,
        max_file_size_mb=max_size
    )

    assert small_image.cached == False
    assert big_image.cached == True

    # Check metadata is created
    assert small_image.metadata['width'] == 100
    assert small_image.metadata['height'] == 100
    assert small_image.metadata['channels'] == 3
    
    #(684, 715, 4)
    assert big_image.metadata['width'] == 715
    assert big_image.metadata['height'] == 684
    assert big_image.metadata['channels'] == 4


    small_image_json = small_image.model_dump_json()
    big_image_json = big_image.model_dump_json()

    assert get_string_size_mb(small_image_json) <= max_size
    assert get_string_size_mb(big_image_json) <= max_size

    small_image_deserialized = NodeField.model_validate_json(small_image_json)
    big_image_deserialized = NodeField.model_validate_json(big_image_json)

    assert small_image.data.all() == small_image_deserialized.data.all()
    assert big_image.data.all() == big_image_deserialized.data.all()

    # emulate getting the thumbnail
    # big_image_thumbnail = json.loads(big_image_json)['data']
    # Image.fromarray(base64_to_image(big_image_thumbnail)).show()

# test_image()


def test_image_from_frontend():
    '''simulates recieving a full size large image from the frontend and that the image is 
    correctly deserialized, cached, and that the thumbnail is correctly created'''
    max_file_size = 0.1
    image = np.array(Image.open('tests/materials/monkey_1mb.png'))
    image_b64 = image_to_base64(image)

    dict_from_frontend = json.dumps({
        'label': 'Large Image',
        'data': image_b64,
        'dtype': 'image',
        'max_file_size_mb': max_file_size
    })

    datamodel = NodeField.model_validate_json(dict_from_frontend)

    # show the image
    # Image.fromarray(datamodel.data).show()

    # check that the data was not disturbed
    assert datamodel.data.all() == image.all()

    # serialize and deserialize
    datamodel_json = datamodel.model_dump_json()

    assert get_string_size_mb(datamodel_json) <= max_file_size

    datamodel_re = NodeField.model_validate_json(datamodel_json)

    # check that the data was not disturbed
    assert datamodel.data.all() == datamodel_re.data.all()

    # emulate getting the thumbnail
    # thumbnail = json.loads(datamodel_json)['data']
    # Image.fromarray(base64_to_image(thumbnail)).show()


def test_nested_classes():
    '''tests that the data prop can be a hirarchy of nested pydantic models 
    (with the correct ser/deser logic reacting to class_name)'''

    # named base model is a base model with a class name that get serialized
    class NamedBaseModel(BaseModel):
        class_name: str

        @model_validator(mode='before')
        @classmethod
        def load_cached_data(cls, values):
            values['class_name'] = cls.__name__
            return values

    class Egg(NamedBaseModel):
        color: str
        diameter: float

    class Chicken(NamedBaseModel):
        name: str
        eggs: list[Egg]

    # register the parent classes with the Data class
    NodeField.class_options = {'Chicken': Chicken}

    c = Chicken(name='Bantam', eggs=[
        Egg(color='brown'*300000, diameter=2.5),
        Egg(color='white', diameter=2.75)
    ])

    data_with_chicken = NodeField(
        label='Chicken',
        dtype='basemodel',
        data=c,
        max_file_size_mb=0.1,
    )

    # d(data_with_chicken)

    # serialize and deserialize
    data_with_chicken_json = data_with_chicken.model_dump_json()
    data_with_chicken_re = NodeField.model_validate_json(data_with_chicken_json)

    assert data_with_chicken.data.name == data_with_chicken_re.data.name
    assert data_with_chicken.data.eggs[0].color == data_with_chicken_re.data.eggs[0].color
    assert data_with_chicken.data.eggs[0].diameter == data_with_chicken_re.data.eggs[0].diameter
    assert data_with_chicken.data.eggs[1].color == data_with_chicken_re.data.eggs[1].color
    assert data_with_chicken.data.eggs[1].diameter == data_with_chicken_re.data.eggs[1].diameter


def test_data_inside_other_class():
    '''tests that a Data instance can be nested inside another
    class (like a node class)and that the ser/deser logic works'''
    max_size = 0.1

    class DataContainer(BaseModel):
        data_inside: NodeField

    dc_lg = DataContainer(data_inside=NodeField(
        label='Large Data',
        dtype='json', data='AAA'*100000, max_file_size_mb=0.1))
    dc_sm = DataContainer(data_inside=NodeField(
        label='Small Data',
        dtype='json', data='BBB', max_file_size_mb=0.1))

    dc_lg_json = dc_lg.model_dump_json()
    dc_sm_json = dc_sm.model_dump_json()

    dc_lg_re = DataContainer.model_validate_json(dc_lg_json)
    dc_sm_re = DataContainer.model_validate_json(dc_sm_json)

    assert dc_lg.data_inside.data == dc_lg_re.data_inside.data
    assert dc_sm.data_inside.data == dc_sm_re.data_inside.data


def test_data_nested_with_numpy_internals():
    '''tests that nested pydantic models with arbitrary type fields 
    and the correct ser/deser logic can be used in the data field'''

    class NamedBaseModel(BaseModel):
        class_name: str

        @model_validator(mode='before')
        @classmethod
        def load_cached_data(cls, values):
            values['class_name'] = cls.__name__
            return values

    class DataContainer(NamedBaseModel):
        model_config = ConfigDict(arbitrary_types_allowed=True)

        np_data: np.ndarray

        @field_validator('np_data', mode='before')
        def validate_np_data(cls, v):
            return np.array(v)

        @field_serializer('np_data')
        def serialize_np_data(self, v, _info):
            return v.tolist()

    # test serialization and deserialization
    dc_sm = DataContainer(np_data=np.ones((4, 4)))
    dc_lg = DataContainer(np_data=np.ones((1000, 1000)))

    dc_sm_json = dc_sm.model_dump_json()
    dc_lg_json = dc_lg.model_dump_json()

    dc_sm_re = DataContainer.model_validate_json(dc_sm_json)
    dc_lg_re = DataContainer.model_validate_json(dc_lg_json)

    assert dc_sm.np_data.all() == dc_sm_re.np_data.all()
    assert dc_lg.np_data.all() == dc_lg_re.np_data.all()

    NodeField.class_options = {'DataContainer': DataContainer}

    max_size = 0.1

    sm_data_with_numpy_child = NodeField(
        label='Small Data with Numpy Child',
        dtype='basemodel', data=dc_sm, max_file_size_mb=max_size)
    lg_data_with_numpy_child = NodeField(
        label='Large Data with Numpy Child',
        dtype='basemodel', data=dc_lg, max_file_size_mb=max_size)

    assert sm_data_with_numpy_child.cached == False
    assert lg_data_with_numpy_child.cached == True

    # test serialization and deserialization
    sm_data_with_numpy_child_json = sm_data_with_numpy_child.model_dump_json()
    lg_data_with_numpy_child_json = lg_data_with_numpy_child.model_dump_json()

    d(json.loads(sm_data_with_numpy_child_json))
    d(json.loads(lg_data_with_numpy_child_json))

    sm_data_with_numpy_child_re = NodeField.model_validate_json(
        sm_data_with_numpy_child_json)
    lg_data_with_numpy_child_re = NodeField.model_validate_json(
        lg_data_with_numpy_child_json)

    assert sm_data_with_numpy_child.data.np_data.all(
    ) == sm_data_with_numpy_child_re.data.np_data.all()
    assert lg_data_with_numpy_child.data.np_data.all(
    ) == lg_data_with_numpy_child_re.data.np_data.all()
