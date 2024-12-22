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
            label='a', dtype='number', data=FloatData(payload=0)
        )],
        outputs=[OutputNodeField(label='result', dtype='ListData')],
    )
    def exec(cls, a: FloatData) -> ListData:
        return ListData(payload=[a]*2)