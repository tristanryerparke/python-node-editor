import json
import numpy as np
from PIL import Image
import sys
import os

from devtools import debug as d

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.datatypes.image_data import ImageData, image_to_base64


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

    data_json = {
        'class_name': 'ImageData',
        'payload': image_base64
    }

    d(data_json)

    img_data = ImageData.model_validate(data_json)

    d(img_data)

    # assert ImageData.cache_key_exists(img_data.id)

test_image_data_from_frontend()