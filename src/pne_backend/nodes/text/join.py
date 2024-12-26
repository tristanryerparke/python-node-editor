# from functools import lru_cache


from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...datatypes.basic import StringData

MAXSIZE = 10

class JoinNode(BaseNode):
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='separator', dtype='string', data=StringData(payload='')),
            InputNodeField(label='a', dtype='string', data=StringData(payload='')),
            InputNodeField(label='b', dtype='string', data=StringData(payload=''))
        ],
        outputs=[
            OutputNodeField(label='join_result', dtype='string')
        ]
    )
    # @lru_cache(maxsize=MAXSIZE)
    def exec(cls, separator: StringData, a: StringData, b: StringData) -> StringData:
        join_result = separator.payload.join([a.payload, b.payload])
        return StringData(payload=join_result) 