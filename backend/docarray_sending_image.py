from pydantic import BaseModel, Field, field_serializer
from docarray.typing import ImageUrl, ImageNdArray

import json
from typing import Union
import numpy as np
import base64
from io import BytesIO
from PIL import Image

image = ImageUrl('https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')


t = image.load()

im = np.array(t)


def image_to_base64(im: np.ndarray) -> str:
    buffered = BytesIO()
    img = Image.fromarray(im)
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"


class ImageOutput(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    value: Union[np.ndarray, None] = None

    @field_serializer('value', when_used='json')
    def serialize_value(self, value: np.ndarray) -> str:
        return image_to_base64(value)

class Parent(BaseModel):
    image_child: Union[ImageOutput, None] = Field(None)


p = Parent()

p.image_child = ImageOutput(value=im)

print(p.model_dump_json())