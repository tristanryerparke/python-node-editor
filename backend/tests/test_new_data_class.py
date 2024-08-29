import pytest
from pydantic import BaseModel, Field, PrivateAttr, computed_field, field_serializer, model_validator, ConfigDict, field_validator
from typing import Any, Union, Literal, ClassVar
import json
import uuid
import redis
import numpy as np
from PIL import Image
import io
import base64
import os
import reprlib
from devtools import debug as d

# class PydanticEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, BaseModel):
#             return obj.model_dump()
#         return super().default(obj)

def db_str_serialize(dtype: str, data: Any):
    '''serializes data for storage in redis'''
    
    if dtype == 'json':
        return json.dumps(data)
    
    elif dtype == 'numpy' or dtype == 'image':
        return json.dumps(data.tolist())

    elif dtype == 'basemodel':
        return data.model_dump_json()    

    else:
        raise TypeError('unsupported dtype for db storage')

    
def db_str_deserialize(cls,dtype: str, data: str):
    '''deserializes data that came from redis'''
    if dtype == 'json':
        return json.loads(data)
    
    elif dtype == 'numpy' or dtype == 'image':
        return np.array(json.loads(data))
    
    elif dtype == 'basemodel':
        class_dict = json.loads(data)
        class_name = class_dict.get('class_name')
        if class_name in cls.class_options:
            return cls.class_options[class_name].model_validate(class_dict)
        else:
            raise ValueError(f"Class name {class_name} not found in class options")

    else:
        raise TypeError('unsupported dtype for db deserialization')
    
def image_to_base64(img: np.ndarray) -> str:
    '''converts a numpy array to a base64 encoded string'''
    img = Image.fromarray(img)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

def base64_to_image(base64_str: str) -> np.ndarray:
    '''converts a base64 encoded string to a numpy array'''
    img_data = base64.b64decode(base64_str)
    return np.array(Image.open(io.BytesIO(img_data)))

def prep_data_for_frontend_serialization(dtype: str, data: Any) -> str:
    '''catches and converts non-serializable small data types before sending to frontend'''
    if dtype == 'json':
        return data # json doesn't need preprocessing
    
    elif dtype == 'numpy':
        return data.tolist() # convert numpy array to list
    
    elif dtype == 'image':
        return image_to_base64(data)
    
    
    
    elif dtype == 'basemodel':
        return data.model_dump()
    
    else:
        raise TypeError('unsupported dtype for frontend serialization')

def prep_data_for_frontend_deserialization(dtype: str, data: Any) -> Any:
    '''re-instantiates non-serializable data types when receiving small data from frontend'''
    if dtype == 'json':
        return data # json doesn't need preprocessing
    
    elif dtype == 'numpy':
        # if the data is already a numpy array, return it, this happens when creating a class
        if isinstance(data, np.ndarray):
            return data
        else:
            return np.array(data) # convert list to numpy array
    
    elif dtype == 'image':
        if isinstance(data, np.ndarray):
            return data
        else:
            return base64_to_image(data)
        
    elif dtype == 'basemodel':
        return data

    else:
        raise TypeError('unsupported dtype for frontend deserialization')


    
def truncate_repr(obj):
    r = reprlib.Repr()
    r.maxstring = 50  # max characters for strings
    r.maxother = 50   # max characters for other repr
    return r.repr(obj).strip("'")





redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Get the max file size from environment variable, default to 5MB if not set
MAX_FILE_SIZE_MB = 1

class Data(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4())) # id is for retrieving large data from the db
    dtype: Literal['json', 'numpy', 'image', 'basemodel'] # dtype helps us know how to save, load, serialize, deserialize
    data: Any = None # front facing data attribute / preview
    # _data: Any = PrivateAttr(default=None)  # this is the "true" data attribute where full data is stored
    max_file_size_mb: float = Field(default=MAX_FILE_SIZE_MB)
    class_name: str
    class_options: ClassVar[dict] = {}

    @field_serializer('data')
    def serialize_data(self, data: Any, _info: Any) -> Any:
        '''return a truncated repr of the data if big (cached), otherwise return the data'''
        if self.cached:
            redis_client.set(self.id, db_str_serialize(self.dtype, self.data))
            if self.dtype == 'image':
                img = Image.fromarray(data).convert("RGB")
                max_pixels = int((self.max_file_size_mb * 1024 * 1024) / 3)  # 3 bytes per pixel for RGB
                max_side = int(np.sqrt(max_pixels))
                img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
                return image_to_base64(np.array(img))
            else:
                return truncate_repr(data)
        else:
            return prep_data_for_frontend_serialization(self.dtype, data)
    
    @computed_field(alias='cached', title='Flag for large data cached in db', repr=True)
    @property
    def cached(self) -> bool:
        '''for large data, we cache in redis db, this checks the size and assigns the flag'''
        if self.size_mb >= self.max_file_size_mb:
            return True
        else:
            return False
        
    @computed_field(alias='description', title='Data Description', repr=True)
    def description(self) -> str:
        '''returns a description of the data'''
        if self.dtype == 'json':
            return None
        elif self.dtype == 'numpy':
            return f'{self.data.shape}'
        elif self.dtype == 'image':
            return f'Image: {self.data.shape[1]}x{self.data.shape[0]}px'
        elif self.dtype == 'basemodel':
            return f'{self.data.class_name} instance'
        else:
            raise TypeError('unsupported dtype for description')
    
    @computed_field(alias='size_mb', title='Size in Megabytes', repr=True)
    @property
    def size_mb(self) -> float:
        '''calculates an attribute for the data size in megabytes'''

        if self.dtype == 'json':
            json_data = json.dumps(self.data)
            size = len(json_data.encode('utf-8'))
        elif self.dtype == 'numpy' or self.dtype == 'image':
            size = self.data.nbytes
        elif self.dtype == 'basemodel':
            size = len(json.dumps(self.data.model_dump()).encode('utf-8'))
        else:
            raise TypeError(f'Invalid dtype: {self.dtype}')
        
        return size / (1024 * 1024)

    @model_validator(mode='before')
    @classmethod
    def load_cached_data(cls, values):
        '''loads data from cache if the id is in the cache, and replaces the data attribute with the deserialized data'''
        if values.get('cached') and redis_client.exists(values.get('id')):
            cached_data = redis_client.get(values['id']).decode('utf-8')
            values['data'] = db_str_deserialize(cls, values['dtype'], cached_data)
        else:
            values['data'] = prep_data_for_frontend_deserialization(values['dtype'], values['data'])
            if values['dtype'] == 'basemodel':
                if isinstance(values['data'], dict):
                    values['data'] = cls.class_options[values['data']['class_name']].model_validate(values['data'])
        # add the class name to the values
        values['class_name'] = cls.__name__
        return values

            
def get_string_size_mb(s: str) -> float:
    return len(s.encode('utf-8')) / (1024 * 1024)


def test_serialize_and_deserialize():
    MAX_SIZE = 0.1

    # create two data instances, one large and one small
    large_data = Data(dtype='json', data='AAA'*100000, max_file_size_mb=MAX_SIZE)
    small_data = Data(dtype='json', data='BBB', max_file_size_mb=MAX_SIZE)

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

    large_data_deserialized = Data.model_validate_json(large_data_json)
    small_data_deserialized = Data.model_validate_json(small_data_json)

    # after deserialization, both cached and un-cached data should be complete
    assert large_data_deserialized.data == large_data.data
    assert small_data_deserialized.data == small_data.data
    assert large_data_deserialized.size_mb == large_data.size_mb
    assert small_data_deserialized.size_mb == small_data.size_mb

    props_concentated_re = large_data_deserialized.data + small_data_deserialized.data

    # the concatenation of the two data after ser/de-ser should be the same as the original
    assert props_concentated_re == props_concentated

def test_different_basic_data_types():
    MAX_SIZE = 0.1

    small_data_inst_with_different_types = [
        # small data
        Data(dtype='json', data='this is some test string data', max_file_size_mb=MAX_SIZE), # string
        Data(dtype='json', data=1234567890, max_file_size_mb=MAX_SIZE), # int
        Data(dtype='json', data=123.456, max_file_size_mb=MAX_SIZE), # float
        Data(dtype='json', data=True, max_file_size_mb=MAX_SIZE), # bool
        Data(dtype='json', data=None, max_file_size_mb=MAX_SIZE), # None
        Data(dtype='json', data=[1,2], max_file_size_mb=MAX_SIZE), # list of ints
        Data(dtype='json', data={'a':1,'b':2}, max_file_size_mb=MAX_SIZE), # dict with ints
        Data(dtype='json', data=[['a','b'],2], max_file_size_mb=MAX_SIZE), # nested list with differing data
    ]

    # serialize and deserialize each
    for di in small_data_inst_with_different_types:
        
        # check is small
        assert di.cached == False

        di_json = di.model_dump_json()

        # check that the size of the json string is within the max size too
        assert get_string_size_mb(di_json) <= MAX_SIZE

        di_deserialized = Data.model_validate_json(di_json)

        # check that the data was not disturbed
        assert di.data == di_deserialized.data

    
    large_data_inst_with_different_types = [
        Data(dtype='json', data=[['a','b'] * 100000,2], max_file_size_mb=MAX_SIZE), # nested list with differing data
        Data(dtype='json', data=[['a',{'b':20}] * 100000, None], max_file_size_mb=MAX_SIZE), # nested list with differing data
    ]

    # serialize and deserialize each
    for di in large_data_inst_with_different_types:
        
        # check is large
        assert di.cached == True

        di_json = di.model_dump_json()

        # check that the size of the json string is within the max size too
        assert get_string_size_mb(di_json) <= MAX_SIZE

        di_deserialized = Data.model_validate_json(di_json)

        # # check that the data was not disturbed
        assert di.data == di_deserialized.data

def test_as_if_coming_from_frontend():

    data_from_frontend = json.dumps({
        'data' : 'AAA'*1000000,
        'dtype' : 'json'
    })

    datamodel = Data.model_validate_json(data_from_frontend)

    assert datamodel.cached == True

    # emulate sending back to frontend
    data_to_frontend = datamodel.model_dump_json()

    # check that data is a preview
    assert '...' in json.loads(data_to_frontend)['data']

def test_numpy():
    max_size = 0.1

    small_numpy = Data(dtype='numpy', data=np.ones((10,10)))
    big_numpy = Data(dtype='numpy', data=np.ones((1000,1000)), max_file_size_mb=max_size)

    assert small_numpy.cached == False
    assert big_numpy.cached == True

    small_numpy_json = small_numpy.model_dump_json()
    big_numpy_json = big_numpy.model_dump_json()

    # check that the size of the json string is within the max size too
    assert get_string_size_mb(small_numpy_json) <= max_size
    assert get_string_size_mb(big_numpy_json) <= max_size

    small_numpy_deserialized = Data.model_validate_json(small_numpy_json)
    big_numpy_deserialized = Data.model_validate_json(big_numpy_json)

    # check that the data was not disturbed
    assert small_numpy.data.all() == small_numpy_deserialized.data.all()
    assert big_numpy.data.all() == big_numpy_deserialized.data.all()

def test_numpy_from_frontend():
    data_from_frontend = '''{
        "data" : "[[1,2,3],[4,5,6]]",
        "dtype" : "numpy"
    }'''

    datamodel = Data.model_validate_json(data_from_frontend)

    assert datamodel.cached == False
    assert type(datamodel.data) == np.ndarray

def test_image():
    import cv2
    max_size = 0.5

    small_img = np.array(Image.new('RGB', (100, 100), color = (255,255,255)))
    big_img = np.array(Image.open('monkey_1mb.png'))

    small_image = Data(dtype='image', data=small_img, max_file_size_mb=max_size)
    big_image = Data(dtype='image', data=big_img, max_file_size_mb=max_size)

    assert small_image.cached == False
    assert big_image.cached == True

    small_image_json = small_image.model_dump_json()
    big_image_json = big_image.model_dump_json()

    assert get_string_size_mb(small_image_json) <= max_size
    assert get_string_size_mb(big_image_json) <= max_size
    
    small_image_deserialized = Data.model_validate_json(small_image_json)
    big_image_deserialized = Data.model_validate_json(big_image_json)

    assert small_image.data.all() == small_image_deserialized.data.all()
    assert big_image.data.all() == big_image_deserialized.data.all()

    # emulate getting the thumbnail
    # big_image_thumbnail = json.loads(big_image_json)['data']
    # Image.fromarray(base64_to_image(big_image_thumbnail)).show()

def test_image_from_frontend():
    max_file_size = 0.1
    image =np.array(Image.open('monkey_1mb.png'))
    image_b64 = image_to_base64(image)

    dict_from_frontend = json.dumps({
        'data' : image_b64,
        'dtype' : 'image',
        'max_file_size_mb' : max_file_size
    })

    datamodel = Data.model_validate_json(dict_from_frontend)

    # show the image
    #Image.fromarray(datamodel.data).show()

    # check that the data was not disturbed
    assert datamodel.data.all() == image.all()

    # serialize and deserialize
    datamodel_json = datamodel.model_dump_json()

    assert get_string_size_mb(datamodel_json) <= max_file_size

    datamodel_re = Data.model_validate_json(datamodel_json)

    # check that the data was not disturbed
    assert datamodel.data.all() == datamodel_re.data.all()

    # emulate getting the thumbnail
    # thumbnail = json.loads(datamodel_json)['data']
    # Image.fromarray(base64_to_image(thumbnail)).show()

def test_nested_classes():

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
    Data.class_options = {'Chicken' : Chicken}

    c = Chicken(name='Bantam', eggs=[
        Egg(color='brown'*300000, diameter=2.5), 
        Egg(color='white', diameter=2.75)
    ])

    data_with_chicken = Data(
        dtype='basemodel', 
        data=c, 
        max_file_size_mb=0.1,
    )

    d(data_with_chicken)

    # serialize and deserialize
    data_with_chicken_json = data_with_chicken.model_dump_json()
    data_with_chicken_re = Data.model_validate_json(data_with_chicken_json)

    assert data_with_chicken.data.name == data_with_chicken_re.data.name
    assert data_with_chicken.data.eggs[0].color == data_with_chicken_re.data.eggs[0].color
    assert data_with_chicken.data.eggs[0].diameter == data_with_chicken_re.data.eggs[0].diameter
    assert data_with_chicken.data.eggs[1].color == data_with_chicken_re.data.eggs[1].color
    assert data_with_chicken.data.eggs[1].diameter == data_with_chicken_re.data.eggs[1].diameter


def test_data_inside_other_class():
    max_size = 0.1

    class DataContainer(BaseModel):
        data_inside: Data

    dc_lg = DataContainer(data_inside=Data(dtype='json', data='AAA'*100000, max_file_size_mb=0.1))
    dc_sm = DataContainer(data_inside=Data(dtype='json', data='BBB', max_file_size_mb=0.1))

    dc_lg_json = dc_lg.model_dump_json()
    dc_sm_json = dc_sm.model_dump_json()

    dc_lg_re = DataContainer.model_validate_json(dc_lg_json)
    dc_sm_re = DataContainer.model_validate_json(dc_sm_json)

    assert dc_lg.data_inside.data == dc_lg_re.data_inside.data
    assert dc_sm.data_inside.data == dc_sm_re.data_inside.data


def test_data_nested_with_numpy_internals():

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
    dc_sm = DataContainer(np_data=np.ones((4,4)))
    dc_lg = DataContainer(np_data=np.ones((1000,1000)))

    dc_sm_json = dc_sm.model_dump_json()
    dc_lg_json = dc_lg.model_dump_json()

    dc_sm_re = DataContainer.model_validate_json(dc_sm_json)
    dc_lg_re = DataContainer.model_validate_json(dc_lg_json)

    assert dc_sm.np_data.all() == dc_sm_re.np_data.all()
    assert dc_lg.np_data.all() == dc_lg_re.np_data.all()

    Data.class_options = {'DataContainer' : DataContainer}

    max_size = 0.1

    sm_data_with_numpy_child = Data(dtype='basemodel', data=dc_sm, max_file_size_mb=max_size)
    lg_data_with_numpy_child = Data(dtype='basemodel', data=dc_lg, max_file_size_mb=max_size)

    assert sm_data_with_numpy_child.cached == False
    assert lg_data_with_numpy_child.cached == True

    

    # test serialization and deserialization
    sm_data_with_numpy_child_json = sm_data_with_numpy_child.model_dump_json()
    lg_data_with_numpy_child_json = lg_data_with_numpy_child.model_dump_json()

    d(json.loads(sm_data_with_numpy_child_json))
    d(json.loads(lg_data_with_numpy_child_json))

    sm_data_with_numpy_child_re = Data.model_validate_json(sm_data_with_numpy_child_json)
    lg_data_with_numpy_child_re = Data.model_validate_json(lg_data_with_numpy_child_json)

    assert sm_data_with_numpy_child.data.np_data.all() == sm_data_with_numpy_child_re.data.np_data.all()
    assert lg_data_with_numpy_child.data.np_data.all() == lg_data_with_numpy_child_re.data.np_data.all()


test_data_nested_with_numpy_internals()


