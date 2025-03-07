import json
import numpy as np
from PIL import Image
import sys
    
from devtools import debug as d


from pne_backend.datatypes.image import ImageData, image_to_base64


def test_computed_fields():
    image = Image.open('tests/materials/monkey_1mb.png')

    p = np.array(image)
    # image = Image.open('monkey_1mb.png')
    img_data = ImageData(payload=np.zeros((10, 10, 1)))

    image_json = img_data.model_dump_json()

    d(json.loads(image_json))

    img_data_from_json = ImageData.model_validate_json(image_json)

    assert np.array_equal(img_data.payload, img_data_from_json.payload)

    image_dict = json.loads(image_json)

    assert image_dict['width'] == 10
    assert image_dict['height'] == 10
    assert image_dict['image_type'] == 'GRAY'

# test_computed_fields()


def test_image_data():
    '''serialize and deserialize an image that gets cached in the backend'''
    image = Image.open('tests/materials/monkey_1mb.png')
    # image = Image.open('monkey_1mb.png')
    img_data = ImageData(payload=np.array(image))
    d(img_data)

    d_as_json = img_data.model_dump_json()
    print(f'size of data sent to frontend: {sys.getsizeof(d_as_json) / 1024 / 1024:.2f} MB')
    d(json.loads(d_as_json))
    data_from_json = ImageData.model_validate_json(d_as_json)

    assert np.array_equal(img_data.payload, data_from_json.payload)
    assert img_data.cached
    assert data_from_json.preview is not None


# test_image_data()


def test_image_data_from_frontend():
    """Test that an image can be serialized and deserialized from the frontend"""
    image = Image.open('tests/materials/monkey_1mb.png')
    image_base64 = image_to_base64(image)
    d(image_base64[:100])

    data_json_as_if_from_frontend = json.dumps({
        'class_name': 'ImageData',
        'payload': image_base64
    })

    d(data_json_as_if_from_frontend)
    # this works:
    img_data = ImageData.model_validate_json(data_json_as_if_from_frontend)

    # this does not:
    img_data = ImageData.model_validate(json.loads(data_json_as_if_from_frontend))

    d(img_data)

    # assert ImageData.cache_key_exists(img_data.id)

test_image_data_from_frontend()