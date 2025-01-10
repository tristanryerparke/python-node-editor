from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from ...datatypes.compound import ListData


class ListOfTwoNode(BaseNode):
    group: str = 'Experimental'

    @classmethod
    @node_definition(
        inputs=[InputNodeField(
            label='a',
            data=FloatData(payload=0),
            allowed_types=['FloatData']
        )],
        outputs=[OutputNodeField(
            label='result',
            allowed_types=['ListData']
        )],
    )
    def exec(cls, a: FloatData) -> ListData:
        return ListData(payload=[a]*2)