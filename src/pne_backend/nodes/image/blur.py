from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from PIL import Image, ImageFilter

from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData
from ...datatypes.image import ImageData

class BlurImageNode(BaseNode):
    width: int = 275

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='image', dtype='image'),
            InputNodeField(label='radius', dtype='number', data=IntData(payload=6), metadata={
                'min': 0,
                'max': 100,
                'displayFormat': 'slider'
            })
        ],
        outputs=[
            OutputNodeField(field_type='output', label='blurred_image', dtype='image')
        ]
    )
    def exec(cls, image: ImageData, radius: IntData) -> ImageData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius.payload))
        return ImageData(payload=np.array(img)) 
