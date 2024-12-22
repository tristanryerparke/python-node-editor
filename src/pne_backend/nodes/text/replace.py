from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData

MAXSIZE = 10

class ReplaceNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='text', dtype='string', data=StringData(payload='')),
            InputNodeField(label='old', dtype='string', data=StringData(payload='')),
            InputNodeField(label='new', dtype='string', data=StringData(payload=''))
        ],
        outputs=[
            OutputNodeField(label='replace_result', dtype='string')
        ]
    )
    def exec(cls, text: StringData, old: StringData, new: StringData) -> StringData:
        text_replaced = text.payload.replace(old.payload, new.payload)
        return StringData(payload=text_replaced) 