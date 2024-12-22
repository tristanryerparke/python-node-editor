from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from PIL import Image

from ...field import InputNodeField, OutputNodeField
from ...datatypes.image import ImageData
from ...base_node import BaseNode, node_definition

class FlipHorizontallyNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='image', dtype='image')
        ],
        outputs=[
            OutputNodeField(label='flipped_image', dtype='image')
        ]
    )
    def exec(cls, image: ImageData) -> ImageData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return ImageData(payload=np.array(flipped_img), dtype='image')
