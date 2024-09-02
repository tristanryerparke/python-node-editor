from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter
from devtools import debug as d

from ..datatypes.field import NodeField
from ..datatypes.base_node import BaseNode

MAXSIZE = 10

DISPLAY_NAME = "Image"

class ImageFromUrlNode(BaseNode):
    @classmethod
    def exec(
        cls, 
        url: NodeField(field_type='input', label='URL', dtype='string', data='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')
    ) -> NodeField(field_type='output', label='Image', dtype='image'):
        url: str = url.data
        
        image_url = ImageUrl(url)
        image_tensor = np.array(image_url.load())
        return NodeField(field_type='output', label='Image', dtype='image', data=image_tensor)

class BlurImageNode(BaseNode):
    @classmethod
    def exec(
        cls,
        image: NodeField(field_type='input', label='A', dtype='image'),
        radius: NodeField(field_type='input', label='B', dtype='number', data=5)
    ) -> NodeField(field_type='output', label='Blurred Image', dtype='image'):
        image: np.ndarray = image.data
        radius: float = radius.data


        img = Image.fromarray(image.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return NodeField(field_type='output', label='Blurred Image', dtype='image', data=np.array(img))

class FlipHorizontallyNode(BaseNode):
    @classmethod
    def exec(
        cls,
        image: NodeField(field_type='input', label='Image', dtype='image')
    ) -> NodeField(field_type='output', label='Flipped Image', dtype='image'):
        img = Image.fromarray(image.data.astype(np.uint8))
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return NodeField(field_type='output', label='Flipped Image', dtype='image', data=np.array(flipped_img))