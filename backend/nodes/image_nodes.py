from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter
from devtools import debug as d
import requests
from io import BytesIO

from ..datatypes.field import NodeField
from ..datatypes.base_node import BaseNode, node_definition


DISPLAY_NAME = "Image"

class ImageFromUrlNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(
                field_type='input', 
                label='URL', 
                dtype='string', 
                data='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true'
            )
        ],
        outputs=[
            NodeField(field_type='output', label='Image', dtype='image')
        ]
    )
    def exec(cls, URL: str) -> np.ndarray:
        response = requests.get(URL)
        response.raise_for_status()  # Raise an exception for bad status codes
        image = Image.open(BytesIO(response.content))
        
        # Convert image to RGB mode if it's not already
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_tensor = np.array(image)
        return image_tensor

class BlurImageNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            NodeField(field_type='input', label='image', dtype='image'),
            NodeField(field_type='input', label='radius', dtype='number', data=6, metadata={
                'min': 0,
                'max': 100,
                'displayFormat': 'slider'
            })
        ],
        outputs=[
            NodeField(field_type='output', label='Blurred Image', dtype='image')
        ]
    )
    def exec(cls, image: np.ndarray, radius: float) -> np.ndarray:
        img = Image.fromarray(image.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return np.array(img)
    
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
            NodeField(field_type='input', label='image', dtype='image')
        ],
        outputs=[
            NodeField(field_type='output', label='flipped_image', dtype='image')
        ]
    )
    def exec(cls, image: np.ndarray) -> np.ndarray:
        img = Image.fromarray(image.astype(np.uint8))
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return np.array(flipped_img)
