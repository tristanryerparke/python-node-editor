from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter
from devtools import debug as d
import requests
from io import BytesIO

from ..datatypes.field import InputNodeField, OutputNodeField
from ..datatypes.field_data import FieldData
from ..datatypes.base_node import BaseNode, node_definition


DISPLAY_NAME = "Image"

class ImageFromUrlNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                field_type='input', 
                label='URL', 
                dtype='string', 
                data=FieldData(
                    payload=f'https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true', 
                    dtype='string'
                )
            )
        ],
        outputs=[
            OutputNodeField(field_type='output', label='Image', dtype='image')
        ]
    )
    def exec(cls, url: FieldData) -> np.ndarray:
        response = requests.get(url.payload)
        response.raise_for_status()  # Raise an exception for bad status codes
        image = Image.open(BytesIO(response.content))
        
        # Convert image to RGB mode if it's not already
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_tensor = np.array(image)
        return FieldData(payload=image_tensor, dtype='image')

class BlurImageNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='image', dtype='image'),
            InputNodeField(field_type='input', label='radius', dtype='number', data=FieldData(payload=6, dtype='number'), metadata={
                'min': 0,
                'max': 100,
                'displayFormat': 'slider'
            })
        ],
        outputs=[
            OutputNodeField(field_type='output', label='Blurred Image', dtype='image')
        ]
    )
    def exec(cls, image: FieldData, radius: FieldData) -> FieldData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius.payload))
        return FieldData(payload=np.array(img), dtype='image')
    
    @classmethod
    def metadata(cls, result):
        return {
            'width': result.shape[1],
            'height': result.shape[0],
            'channels': result.shape[2] if result.ndim == 3 else 1
        }


class FlipHorizontallyNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='image', dtype='image')
        ],
        outputs=[
            OutputNodeField(field_type='output', label='flipped_image', dtype='image')
        ]
    )
    def exec(cls, image: FieldData) -> FieldData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return FieldData(payload=np.array(flipped_img), dtype='image')
