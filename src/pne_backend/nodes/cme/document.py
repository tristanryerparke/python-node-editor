from typing import Tuple
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData, FloatData, UnitsData
from ...datatypes.image import ImageData
from ...base_node import BaseNode, node_definition
from ...base_data import SendableDataModel

class Document(SendableDataModel):

    image: ImageData
    units: UnitsData
    width: FloatData
    height: FloatData

class ConstructDocumentNode(BaseNode):
    '''Creates a document, a collection of an image, units, width, and height.'''
    width: int = 275

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(field_type='input', label='image', dtype='image'),
            InputNodeField(field_type='input', label='units', dtype='string', data=StringData(payload='mm')),
            InputNodeField(field_type='input', label='width', dtype='number', data=FloatData(payload=100)),
            InputNodeField(field_type='input', label='height', dtype='number', data=FloatData(payload=100))
        ],
        outputs=[
            OutputNodeField(field_type='output', label='document', dtype='object')
        ]
    )
    def exec(cls, image: ImageData, units: UnitsData, width: FloatData, height: FloatData) -> Document:
        return Document(
            image=image,
            units=units,
            width=width,
            height=height
        )
    
class DeconstructDocumentNode(BaseNode):
    '''Deconstructs a document into its image, units, width, and height.'''
    @classmethod
    @node_definition(
        inputs=[InputNodeField(label='document', dtype='object')],
        outputs=[
            OutputNodeField(label='image', dtype='image'),
            OutputNodeField(label='units', dtype='string'),
            OutputNodeField(label='width', dtype='number'),
            OutputNodeField(label='height', dtype='number')
        ]
    )
    def exec(cls, document: Document) -> Tuple[ImageData, UnitsData, FloatData, FloatData]:
        return document.image, document.units, document.width, document.height