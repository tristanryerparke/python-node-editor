import numpy as np

from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...base_data import BaseData, register_class
from ...datatypes.compound import ListData
from ...datatypes.compound import ModelData
from ...datatypes.basic import IntData, FloatData
from ...datatypes.image import ImageData


class TestImageNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                allowed_types=['ImageData'],
                data=ImageData(payload=np.random.randint(0, 255, (100, 100, 3))),
                label='inputA',
            ),
        ],
        outputs=[
            OutputNodeField(field_type='output', label='output', dtype='ImageData'),
        ],
    )
    def exec(cls, a: ImageData) -> ImageData:
        return a