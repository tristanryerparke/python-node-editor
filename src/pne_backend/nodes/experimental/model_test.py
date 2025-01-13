from ...base_node import BaseNode, node_definition
from ...field import InputNodeField, OutputNodeField
from ...base_data import BaseData, register_class
from ...datatypes.compound import ListData
from ...datatypes.compound import ModelData
from ...datatypes.basic import IntData, FloatData



@register_class
class TestModel(ModelData):
    a: IntData
    b: ListData


t1 = TestModel(
    a=IntData(payload=1), 
    b=ListData(payload=[
        IntData(payload=2),
        IntData(payload=3),
    ])
)


class TestModelNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                data=t1,
                label='input',
            ),
        ],
        outputs=[
            OutputNodeField(label='output',)
        ]
    )
    def exec(cls, input: TestModel) -> TestModel:
        copy = input.model_copy(deep=True)
        copy.a.payload += 1
        copy.b.payload[0].payload += 1
        copy.b.payload[1].payload += 1
        return copy