from typing import Tuple, Union, Dict, Generator, ClassVar
import numpy as np
from docarray.typing import ImageUrl
from PIL import Image
import requests
from io import BytesIO

from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData
from ...datatypes.image import ImageData
from ...base_node import BaseNode, node_definition

class ImageFromUrlNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='URL', 
                dtype='string', 
                data=StringData(
                    payload='https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true', 
                )
            )
        ],
        outputs=[
            OutputNodeField(label='Image', dtype='image')
        ]
    )
    def exec(cls, url: StringData) -> ImageData:
        response = requests.get(url.payload)
        response.raise_for_status()  # Raise an exception for bad status codes
        image = Image.open(BytesIO(response.content))
        
        # Convert image to RGB mode if it's not already
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return ImageData(payload=np.array(image)) 
