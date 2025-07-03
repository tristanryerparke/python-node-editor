from functools import lru_cache

from ...base_node import BaseNode, node_definition, register_node
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData

MAXSIZE = 10

@register_node('Text', group='Basic')
class JoinNode(BaseNode):

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                label='a',
                user_label='First Text', 
                allowed_types=['StringData'],
                data=StringData(payload='')
            ),
            InputNodeField(
                label='b',
                user_label='Second Text',
                allowed_types=['StringData'],
                data=StringData(payload='')
            ),
            InputNodeField(
                label='separator',
                user_label='Separator',
                allowed_types=['StringData'], 
                data=StringData(payload=' ')
            )
        ],
        outputs=[
            OutputNodeField(
                label='join_result',
                user_label='Joined Text',
                allowed_types=['StringData']
            )
        ]
    )
    @lru_cache(maxsize=MAXSIZE)
    def exec(cls, a: StringData, b: StringData, separator: StringData) -> StringData:
        join_result = separator.payload.join([a.payload, b.payload])
        return StringData(payload=join_result)