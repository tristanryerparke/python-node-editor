from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image as PILImage, ImageFilter
from devtools import debug as d

from class_defs.image import Image

import sys
import time
from base_node import BaseNode, BaseNodeData
from classes import NodeInput, NodeOutput, NodeOutputImage, NodeInputImage
MAXSIZE = 10

from cachetools import cached, TTLCache
from cachetools.keys import hashkey

class ImageFromUrlNode(BaseNode):

    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        url: NodeInput(label='URL', type='string', value='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')
    ) -> NodeOutputImage(label='Image', type='image'):
        image_url = ImageUrl(url)
        image_tensor = np.array(image_url.load())
        print(f"Image shape: {image_tensor.shape}")
        return NodeOutputImage(label='Image', type='image', value=Image(
            array=image_tensor
        ))
    

class BlurImageNode(BaseNode):

    @classmethod
    @cached(cache=TTLCache(maxsize=MAXSIZE, ttl=300), key=lambda cls, image, radius: hashkey(image.array.tobytes(), radius))
    def exec(
        cls,
        image: NodeInputImage(label='Image', type='image'),
        radius: NodeInput(label='Radius', type='number', value=5)
    ) -> NodeOutputImage(label='Blurred Image', type='image'):
        img = PILImage.fromarray(image.array)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return NodeOutputImage(label='Blurred Image', type='image', value=Image(
            array=np.array(img)
        ))
    
class FlipHorizontallyNode(BaseNode):

    @classmethod
    @cached(cache=TTLCache(maxsize=MAXSIZE, ttl=300), key=lambda cls, image: hashkey(image.array.tobytes()))
    def exec(
        cls,
        image: NodeInputImage(label='Image', type='image')
    ) -> NodeOutputImage(label='Flipped Image', type='image'):
        img = PILImage.fromarray(image.array)
        flipped_img = img.transpose(PILImage.FLIP_LEFT_RIGHT)
        return NodeOutputImage(label='Flipped Image', type='image', value=Image(
            array=np.array(flipped_img)
        ))