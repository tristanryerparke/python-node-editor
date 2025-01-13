import numpy as np

from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...base_data import BaseData, register_class
from ...datatypes.basic import NumpyData

class NumpyTestNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                allowed_types=['NumpyData'],
                default_generator_type='NumpyData',
                data=NumpyData(payload=np.array([1, 2, 3])),
                label='a',
            ),
        ], 
        outputs=[
            OutputNodeField(label='output'),
        ],
    )
    def exec(cls, a: NumpyData) -> NumpyData:
        return NumpyData(payload=a.payload + 5)
