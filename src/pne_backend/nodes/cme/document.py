from typing import Tuple
import numpy as np

from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData, FloatData
from ...datatypes.image import ImageData
from ...base_data import register_class
from ...base_node import BaseNode, node_definition, register_node
from ...datatypes.compound import AutoNodesModelData

@register_class(namespace='Creative Media Extenders', group='Document')
class Document(AutoNodesModelData):
    image: ImageData
    units: StringData
    width: FloatData
    height: FloatData
    
    

# @register_node('Document')
# class ConstructDocumentNode(BaseNode):
#     '''Creates a document, a collection of an image, units, width, and height.'''

#     @classmethod
#     @node_definition(
#         inputs=[
#             InputNodeField(label='image', allowed_types=['ImageData']),
#             InputNodeField(label='units', allowed_types=['StringData'], data=StringData(payload='mm')),
#             InputNodeField(label='width', allowed_types=['FloatData'], data=FloatData(payload=10)),
#             InputNodeField(label='height', allowed_types=['FloatData'], data=FloatData(payload=10))
#         ],
#         outputs=[
#             OutputNodeField(label='document')
#         ]
#     )
#     def exec(cls, image: ImageData, units: StringData, width: FloatData, height: FloatData) -> Document:
#         return Document(
#             image=image,
#             units=units,
#             width=width,
#             height=height
#         )
    
# @register_node('Document')
# class DeconstructDocumentNode(BaseNode):
#     '''Deconstructs a document into its image, units, width, and height.'''
#     @classmethod
#     @node_definition(
#         inputs=[InputNodeField(label='document', data=Document(
#             image=ImageData(payload=np.zeros((100, 100, 3))), 
#             units=StringData(payload='mm'), 
#             width=FloatData(payload=10), 
#             height=FloatData(payload=10)
#         ))],
#         outputs=[
#             OutputNodeField(label='image'),
#             OutputNodeField(label='units'),
#             OutputNodeField(label='width'),
#             OutputNodeField(label='height')
#         ]
#     )
#     def exec(cls, document: Document) -> Tuple[ImageData, StringData, FloatData, FloatData]:
#         return document.image, document.units, document.width, document.height