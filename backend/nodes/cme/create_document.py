from typing import Tuple, Union, Dict, Generator, ClassVar, Any
import numpy as np
from PIL import Image, ImageFilter
from pydantic import BaseModel, ConfigDict, field_serializer, field_validator
from ...datatypes.field import InputNodeField, OutputNodeField
from ...datatypes.field_data import FieldData
from ...datatypes.base_node import BaseNode, node_definition
from ...datatypes.named_base_model import NamedBaseModel

class Document(NamedBaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    image: np.ndarray
    units: str
    width: float
    height: float

    @field_serializer('image')
    def serialize_image(image: np.ndarray):
        return image.tolist()
    
    @field_validator('image', mode='before')
    @classmethod
    def validate_image(cls, image: Any):
        if isinstance(image, list):
            return np.array(image)
        elif isinstance(image, np.ndarray):
            return image
        else:
            raise ValueError('invalid image')

class CreateDocumentNode(BaseNode):
    '''Creates a document, a collection of an image, units, width, and height.'''
    width: int = 275

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='image', dtype='image'),
            InputNodeField(field_type='input', label='units', dtype='string', data=FieldData(dtype='string', payload='mm')),
            InputNodeField(field_type='input', label='width', dtype='number', data=FieldData(dtype='number', payload=100)),
            InputNodeField(field_type='input', label='height', dtype='number', data=FieldData(dtype='number', payload=100))
        ],
        outputs=[
            OutputNodeField(field_type='output', label='document', dtype='object')
        ]
    )
    def exec(cls, image: FieldData, units: FieldData, width: FieldData, height: FieldData) -> FieldData:
        return FieldData(
            payload=Document(
                image=image.payload,
                units=units.payload,
                width=width.payload,
                height=height.payload
            ),
            dtype='object'
        )