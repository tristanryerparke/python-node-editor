import base64
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field, field_serializer, field_validator, ConfigDict
from io import BytesIO
from typing import Any, Union
import cv2
from .image import ImageData
from .field_data import Data

THUMBNAIL_SIZE = (100, 100)  # Global variable for thumbnail size

class NodeInput(BaseModel):
    label: str
    type: str
    input_data: Union[Data, None] = None

class NodeOutput(BaseModel):
    label: str
    type: str
    output_data: Union[Data, None] = None


# def output_class_from_type_name(type_name: str):
#     if type_name == 'image':
#         return NodeOutputImage
#     elif type_name == 'number':
#         return NodeOutput
#     elif type_name == 'string':
#         return NodeOutput
    
# def input_class_from_type_name(type_name: str):
#     if type_name == 'image':
#         return NodeInputImage
#     elif type_name == 'number':
#         return NodeInput
#     elif type_name == 'string':
#         return NodeInput
    

# class NodeInputImage(NodeInput):
#     model_config = ConfigDict(arbitrary_types_allowed=True)

#     type: str = 'image'
#     input_data: Union[ImageData, None] = None

#     # creates a full ImageData object if reconstructing from data that contains an image_array
#     @field_validator('input_data', mode='before')
#     @classmethod
#     def check_input_data(cls, input_data) -> Any:
#         if isinstance(input_data, dict):
#             if 'image_array' in input_data:
#                 return ImageData.from_base64(input_data['image_array'])
#         return input_data
    

# class NodeOutputImage(NodeOutput):
#     model_config = ConfigDict(arbitrary_types_allowed=True)

#     type: str = 'image'
#     output_data: Union[ImageData, None] = None

#     # creates a full ImageData object if reconstructing from data that contains an image_array
#     @field_validator('output_data', mode='before')
#     @classmethod
#     def check_output_data(cls, output_data) -> Any:
#         if isinstance(output_data, dict):
#             if 'image_array' in output_data:
#                 return ImageData.from_base64(output_data['image_array'])
#         return output_data





# class NodeOutputNumber(NodeOutput):
#     type: str = 'number'
#     output_data: Union[int, float, None] = None       

# class NodeOutputString(NodeOutput):
#     type: str = 'string'
#     output_data: Union[str, None] = None