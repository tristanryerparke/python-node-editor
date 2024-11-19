from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from PIL import Image, ImageFilter

from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData
from ...datatypes.base_node import BaseNode, node_definition

class BlurImageNode(BaseNode):
    width: int = 275

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
            OutputNodeField(field_type='output', label='blurred_image', dtype='image')
        ]
    )
    def exec(cls, image: FieldData, radius: FieldData) -> FieldData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=radius.payload))
        return FieldData(payload=np.array(img), dtype='image') 