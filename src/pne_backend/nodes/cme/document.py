from typing import Tuple
import numpy as np

from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData, FloatData, UnitsData
from ...datatypes.image import ImageData
from ...base_data import register_class
from ...base_node import BaseNode, node_definition
from ...datatypes.compound import ModelData

@register_class
class Document(ModelData):
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
            InputNodeField(label='image', data=ImageData(payload=np.zeros((100, 100, 3)))),
            InputNodeField(label='units', data=StringData(payload='mm')),
            InputNodeField(label='width', data=FloatData(payload=100)),
            InputNodeField(label='height', data=FloatData(payload=100))
        ],
        outputs=[
            OutputNodeField(label='document')
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