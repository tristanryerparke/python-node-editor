from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from PIL import Image

from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData
from ...datatypes.base_node import BaseNode, node_definition

class FlipHorizontallyNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='image', dtype='image')
        ],
        outputs=[
            OutputNodeField(field_type='output', label='flipped_image', dtype='image')
        ]
    )
    def exec(cls, image: FieldData) -> FieldData:
        img = Image.fromarray(image.payload.astype(np.uint8))
        flipped_img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return FieldData(payload=np.array(flipped_img), dtype='image')