import base64
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field, field_serializer, field_validator
from io import BytesIO
from typing import Any, Union
import cv2

THUMBNAIL_SIZE = (100, 100)  # Global variable for thumbnail size

class NodeInput(BaseModel):
    label: str
    type: str
    value: Any = None

class NodeOutput(BaseModel):
    label: str
    type: str
    value: Any = None

def image_to_base64(im: np.ndarray ) -> str:
    
    shape = im.shape
    buffered = BytesIO()
    img = Image.fromarray(im)
    img.save(buffered, format="PNG")

    if im.shape[2] == 3:
        image_type = 'RGB'
    elif im.shape[2] == 4:
        image_type = 'RGBA'
    else:
        image_type = 'Gray'

    short_display = f"({image_type}) {shape[0]}x{shape[1]}px "

    return {
        "short_display": short_display,
        "data": f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"
    }

def output_class_from_type_name(type_name: str):
    if type_name == 'image':
        return NodeOutputImage
    elif type_name == 'number':
        return NodeOutput
    elif type_name == 'string':
        return NodeOutput
    
def input_class_from_type_name(type_name: str):
    if type_name == 'image':
        return NodeInputImage
    elif type_name == 'number':
        return NodeInput
    elif type_name == 'string':
        return NodeInput

class NodeOutputImage(NodeOutput):
    class Config:
        arbitrary_types_allowed = True

    type: str = 'image'
    value: Union[np.ndarray, None] = Field(None)

    @field_serializer('value', when_used='json')
    def serialize_image(self, value: np.ndarray | None):
        if value is None:
            return None
        return image_to_base64(value)
    
    @field_validator('value', mode='before')
    @classmethod
    def deserialize_image(cls, value):
        if isinstance(value, dict) and 'data' in value:
            base64_data = value['data'].split(',')[1]
            image_data = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_data))
            return np.array(image)
        return value

class NodeInputImage(NodeInput):
    class Config:
        arbitrary_types_allowed = True

    type: str = 'image'
    value: Union[np.ndarray, None] = Field(None)

    @field_serializer('value', when_used='json')
    def serialize_image(self, value: np.ndarray | None):
        if value is None:
            return None
        return image_to_base64(value)

    @field_validator('value', mode='before')
    @classmethod
    def deserialize_image(cls, value):
        if isinstance(value, dict) and 'data' in value:
            base64_data = value['data'].split(',')[1]
            image_data = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_data))
            return np.array(image)
        return value

class NodeOutputNumber(NodeOutput):
    type: str = 'number'
    value: Union[int, float, None] = None

class NodeOutputString(NodeOutput):
    type: str = 'string'
    value: Union[str, None] = None