import base64
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field, field_serializer, field_validator
from io import BytesIO
from typing import Any, Union
import cv2
from class_defs.image import Image

THUMBNAIL_SIZE = (100, 100)  # Global variable for thumbnail size

class NodeInput(BaseModel):
    label: str
    type: str
    value: Any = None

class NodeOutput(BaseModel):
    label: str
    type: str
    value: Any = None


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
    value: Union[Image, None] = None


class NodeInputImage(NodeInput):
    class Config:
        arbitrary_types_allowed = True

    type: str = 'image'
    value: Union[Image, None] = None


class NodeOutputNumber(NodeOutput):
    type: str = 'number'
    value: Union[int, float, None] = None

class NodeOutputString(NodeOutput):
    type: str = 'string'
    value: Union[str, None] = None