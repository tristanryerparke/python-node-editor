from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData

MAXSIZE = 10

class ReplaceNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='text',
                user_label='Text',
                allowed_types=['StringData'],
                data=StringData(payload='')
            ),
            InputNodeField(
                label='old',
                user_label='Find',
                allowed_types=['StringData'],
                data=StringData(payload='')
            ),
            InputNodeField(
                label='new',
                user_label='Replace With',
                allowed_types=['StringData'],
                data=StringData(payload='')
            )
        ],
        outputs=[
            OutputNodeField(
                label='replace_result',
                user_label='Result',
                allowed_types=['StringData']
            )
        ]
    )
    def exec(cls, text: StringData, old: StringData, new: StringData) -> StringData:
        text_replaced = text.payload.replace(old.payload, new.payload)
        return StringData(payload=text_replaced) 