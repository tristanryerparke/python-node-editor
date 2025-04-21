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
            InputNodeField(label='image', allowed_types=['ImageData'], metadata={'expanded': True}),
            InputNodeField(label='radius', allowed_types=['IntData'], data=IntData(payload=10))
        ],
        outputs=[
            OutputNodeField(
                label='blurred_image', 
                user_label='Blurred Image',
                allowed_types=['ImageData'],
            )
        ]
    )
    def exec(cls, image: ImageData, radius: IntData) -> ImageData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius.payload))
        return ImageData(payload=np.array(img)) 
