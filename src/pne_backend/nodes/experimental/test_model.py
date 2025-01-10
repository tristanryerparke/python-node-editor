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

print(t1.model_dump_json())

class TestModelNode(BaseNode):
    group: str = 'Basic'

    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(
                allowed_types=['TestModel'],
                default_generator_type='TestModel',
                data=t1,
                label='inputA',
            ),
        ],
        outputs=[
            OutputNodeField(field_type='output', label='c', dtype='number')
        ]
    )
    def exec(cls, a: FloatData, b: FloatData) -> FloatData:
        return FloatData(payload=a.payload + b.payload)