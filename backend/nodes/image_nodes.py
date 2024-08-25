from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter
from devtools import debug as d

from ..datatypes.image import ImageData

import sys
import time
from ..datatypes.base_node import BaseNode, BaseNodeData
from ..datatypes.fields import NodeInput, NodeOutput, NodeOutputImage, NodeInputImage
MAXSIZE = 10

from cachetools import cached, TTLCache
from cachetools.keys import hashkey

class ImageFromUrlNode(BaseNode):

    @classmethod
    # @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        url: NodeInput(label='URL', type='string', input_data='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')
    ) -> NodeOutputImage(label='Image', type='image'):
        image_url = ImageUrl(url)
        image_tensor = np.array(image_url.load())
        print(f"Image shape: {image_tensor.shape}")
        return NodeOutputImage(label='Image', type='image', output_data=ImageData(
            image_array=image_tensor
        ))
    

class BlurImageNode(BaseNode):

    @classmethod
    # @cached(cache=TTLCache(maxsize=MAXSIZE, ttl=300), key=lambda cls, image, radius: hashkey(image.image_array.tobytes(), radius))
    def exec(
        cls,
        image: NodeInputImage(label='A', type='image'),
        radius: NodeInput(label='B', type='number', input_data=5)
    ) -> NodeOutputImage(label='Blurred Image', type='image'):
        img = Image.fromarray(image.image_array)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return NodeOutputImage(label='Blurred Image', type='image', output_data=ImageData(
            image_array=np.array(img)
        ))
    
class FlipHorizontallyNode(BaseNode):

    @classmethod
    # @cached(cache=TTLCache(maxsize=MAXSIZE, ttl=300), key=lambda cls, image: hashkey(image.array.tobytes()))
    def exec(
        cls,
        image: NodeInputImage(label='Image', type='image')
    ) -> NodeOutputImage(label='Flipped Image', type='image'):
        img = Image.fromarray(image.image_array)
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return NodeOutputImage(label='Flipped Image', type='image', output_data=ImageData(
            image_array=np.array(flipped_img)
        ))