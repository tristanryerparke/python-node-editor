from email.mime import image
from ...base_data import register_class
import os
from PIL import Image
import numpy as np

from ...datatypes.image import ImageData
from ...datatypes.basic import StringData, FloatData, IntData
from ...datatypes.compound import ModelData
from ...field import InputNodeField, OutputNodeField
from ...base_node import BaseNode, node_definition
from .optim_util import StrokeOptim



@register_class
class SVGData(StringData):
    '''An svg string'''

@register_class
class StrokeOptimParams(ModelData):
    num_strokes: IntData
    num_steps: IntData
    width_scale: FloatData
    length_scale: FloatData
    style_weight: FloatData
    tv_weight: FloatData
    curvature_weight: FloatData
class ConstructStrokeOptimParamsNode(BaseNode):
    '''Constructs a StrokeOptimParams object from a set of parameters.'''

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='num_strokes', 
                allowed_types=['IntData'], 
                data=IntData(payload=1500),
                metadata={'min': 100, 'max': 5000}
            ),
            InputNodeField(
                label='num_steps',
                allowed_types=['IntData'],
                data=IntData(payload=20),
                metadata={'min': 1, 'max': 100}
            ),
            InputNodeField(
                label='width_scale',
                allowed_types=['FloatData'],
                data=FloatData(payload=3.0),
                metadata={'min': 0.1, 'max': 10.0}
            ),
            InputNodeField(
                label='length_scale',
                allowed_types=['FloatData'],
                data=FloatData(payload=0.75),
                metadata={'min': 0.1, 'max': 2.0}
            ),
            InputNodeField(
                label='style_weight',
                allowed_types=['FloatData'],
                data=FloatData(payload=0.0),
                metadata={'min': 0.0, 'max': 1.0}
            ),
            InputNodeField(
                label='tv_weight',
                allowed_types=['FloatData'],
                data=FloatData(payload=0.01),
                metadata={'min': 0.0, 'max': 1.0}
            ),
            InputNodeField(
                label='curvature_weight',
                allowed_types=['FloatData'],
                data=FloatData(payload=0.0),
                metadata={'min': 0.0, 'max': 20.0}
            ),
        ],
        outputs=[
            OutputNodeField(label='params', allowed_types=['StrokeOptimParams'])
        ]
    )
    def exec(
        cls, 
        num_strokes: IntData, 
        num_steps: IntData, 
        width_scale: FloatData, 
        length_scale: FloatData, 
        style_weight: FloatData, 
        tv_weight: FloatData, 
        curvature_weight: FloatData
    ) -> StrokeOptimParams:
        
        return StrokeOptimParams(
            num_strokes=num_strokes, 
            num_steps=num_steps, 
            width_scale=width_scale, 
            length_scale=length_scale, 
            style_weight=style_weight, 
            tv_weight=tv_weight, curvature_weight=curvature_weight
        )


# class StrokeOptimNode(BaseNode):
#     '''Analyzes an image and returns an svg made up of "paint strokes" that represent the image.'''
#     min_width: int = 250

#     @classmethod
#     @node_definition(
#         inputs=[
#             InputNodeField(label='image', allowed_types=['Document']),
#             InputNodeField(label='params', allowed_types=['StrokeOptimParams']),
#         ],
#         outputs=[
#             OutputNodeField(label='svg', allowed_types=['SVGData'])
#         ]
#     )
#     def exec(cls, document: Document, params: StrokeOptimParams) -> SVGData:
        
#         # Convert numpy array to PIL Image
#         pil_image = Image.fromarray(document.image.payload.astype(np.uint8))
        
#         # Initialize StrokeOptim
#         api_key = os.getenv("VITE_RP_API_KEY")
#         if not api_key:
#             raise ValueError("VITE_RP_API_KEY environment variable not set")
            
#         optim = StrokeOptim(
#             "https://api.runpod.ai/v2/5kp5wea90xdfa3",
#             api_key
#         )
        
#         # Run optimization
#         optim.run(
#             image=pil_image,
#             physical_size_in=(document.width.payload, document.height.payload),
#             num_strokes=params.num_strokes.payload,
#             num_steps=params.num_steps.payload,
#             width_scale=params.width_scale.payload,
#             length_scale=params.length_scale.payload,
#             style_weight=params.style_weight.payload,
#             tv_weight=params.tv_weight.payload,
#             curvature_weight=params.curvature_weight.payload
#         )
        
#         # Get result
#         svg = optim.result()
#         return SVGData(payload=svg) 
