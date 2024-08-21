from typing import Tuple, Union, Dict, Generator
from functools import lru_cache
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image, ImageFilter


import sys
import time
from base_node import BaseNode, BaseNodeData
from classes import NodeOutputImage
MAXSIZE = 10



class ImageFromUrlNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'image': NodeOutputImage()
        }
    )
    # image_out: Union[NodeOutputImage, None] = None

    @classmethod
    def exec(
        cls, 
        url: str = 'https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true'
    ) -> Dict[str, list]:
        image_url = ImageUrl(url)
        image_tensor = np.array(image_url.load())
        print(f"Image shape: {image_tensor.shape}")
        return {'image': image_tensor}
    

class BlurImageNode(BaseNode):
    data: BaseNodeData = BaseNodeData(
        outputs = {
            'image': NodeOutputImage()
        }
    )

    @classmethod
    def exec(
        cls, 
        image: np.ndarray = None,
        radius: int = 2
    ) -> Dict[str, list]:
        img = Image.fromarray(image)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
        return {'image_blurred': np.array(img)}