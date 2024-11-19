from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image
import requests
from io import BytesIO

from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData
from ...datatypes.base_node import BaseNode, node_definition

class ImageFromUrlNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                field_type='input', 
                label='URL', 
                dtype='string', 
                data=FieldData(
                    payload=f'https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true', 
                    dtype='string'
                )
            )
        ],
        outputs=[
            OutputNodeField(field_type='output', label='Image', dtype='image')
        ]
    )
    def exec(cls, url: FieldData) -> np.ndarray:
        response = requests.get(url.payload)
        response.raise_for_status()  # Raise an exception for bad status codes
        image = Image.open(BytesIO(response.content))
        
        # Convert image to RGB mode if it's not already
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_tensor = np.array(image)
        return FieldData(payload=image_tensor, dtype='image') 