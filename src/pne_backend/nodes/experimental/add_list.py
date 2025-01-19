from typing import Union
from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import IntData, FloatData
from ...datatypes.compound import ListData

MAXSIZE = 10

class AddListNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a', 
                user_label='A',
                allowed_types=['ListData'],
                default_generator_type='ListData',
                data=ListData(payload=[
                    IntData(payload=0),
                    IntData(payload=1),
                    ListData(payload=[
                        IntData(payload=2),
                        IntData(payload=3),
                    ]),
                ]),
            ),
            InputNodeField(
                label='b', 
                allowed_types=['ListData'],
                default_generator_type='ListData',
                data=ListData(payload=[
                    IntData(payload=3),
                    IntData(payload=4),
                    IntData(payload=5),
                ]),

            )
        ],
        outputs=[
            OutputNodeField(label='result')
        ]
    )
    def exec(cls, a: ListData, b: ListData) -> ListData:
        result = a.payload + b.payload
        return ListData(payload=result)
