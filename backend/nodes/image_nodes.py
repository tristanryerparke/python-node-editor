from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter


import sys
import time
from base_node import BaseNode, BaseNodeData
from classes import NodeInput, NodeOutput, NodeOutputImage, NodeInputImage
MAXSIZE = 10



class ImageFromUrlNode(BaseNode):
    # data: BaseNodeData = BaseNodeData(
    #     outputs = {
    #         'image': NodeOutputImage()
    #     }
    # )
    # image_out: Union[NodeOutputImage, None] = None

    @classmethod
    def exec(
        cls, 
        url: NodeInput(label='url', type='string', value='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')
    ) -> NodeOutputImage(label='image', type='image'):
        image_url = ImageUrl(url)
        image_tensor = np.array(image_url.load())
        print(f"Image shape: {image_tensor.shape}")
        return NodeOutputImage(label='image', type='image', value=image_tensor)
    

class BlurImageNode(BaseNode):

    @classmethod
    def exec(
        cls, 
        image: NodeInputImage(label='image', type='image'),
        radius: NodeInput(label='radius', type='number', value=2)
    ) -> NodeOutputImage(label='image_blurred', type='image'):
        # time.sleep(5)
        img = Image.fromarray(image)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return NodeOutputImage(label='image_blurred', type='image', value=np.array(img))