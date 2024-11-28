from typing import Union, Dict, Generator, List
import sys
import time
from ..datatypes.base_node import StreamingBaseNode, node_definition
from ..datatypes.field import InputNodeField, OutputNodeField
from ..datatypes.field_data import FieldData

MAXSIZE = 10

DISPLAY_NAME = "Experimental"

class TestStreamingAddNode(StreamingBaseNode):
    description: str = "Test node for streaming that adds two numbers"
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='a', dtype='number', data=FieldData(payload=0, dtype='number')),
            InputNodeField(label='b', dtype='number', data=FieldData(payload=0, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='result', dtype='number')
        ]
    )
    def exec_stream(
        cls,
        a: FieldData,
        b: FieldData
    ) -> Generator[
        Dict[str, Union[str, int, float, List[FieldData]]],
        None,
        None
    ]:
        for i in range(10):
            # yield {'progress': i/5, 'outputs': [NodeField(field_type='output', label='result', dtype='number', data=i)]}
            yield {'progress': i/10, 'outputs': [
                FieldData(payload=i, dtype='number')
            ]}
            time.sleep(1)
            print(f'this status update came from inside the node: {i}')
            result = a.payload + b.payload
        yield {'progress': 1, 'outputs': [FieldData(payload=result, dtype='number')]}

class TestStreamingSplitNode(StreamingBaseNode):
    description: str = "Test node for streaming that splits a number into two numbers"
    @classmethod
    @node_definition(
        inputs=[
            InputNodeField(label='number', dtype='number', data=FieldData(payload=1, dtype='number')),
            InputNodeField(label='t', dtype='number', data=FieldData(payload=0.5, dtype='number'))
        ],
        outputs=[
            OutputNodeField(label='split_t', dtype='number'),
            OutputNodeField(label='split_1_minus_t', dtype='number')
        ]
    )
    def exec_stream(
        cls,
        number: FieldData,
        t: FieldData
    ) -> Generator[
        Dict[str, Union[str, int, float, List[FieldData]]],
        None,
        None
    ]:
        if not 0 <= t.payload <= 1:
            raise ValueError("t must be between 0 and 1")

        for i in range(5):
            print(f'this status update came from inside the node: {i}')
            yield {'progress': i/5}
            time.sleep(1)

        yield {
            'progress': 1,
            'outputs': [
                FieldData(payload=number.payload * t.payload, dtype='number'),
                FieldData(payload=number.payload * (1 - t.payload), dtype='number')
            ]
        }
        


    
# class Egg(NamedBaseModel):
#     color: str
#     diameter: float

# NodeField.class_options['Egg'] = Egg

# default_str = '''{
#     "class_name": "Egg",
#     "color": "brown",
#     "diameter": 2.5
# }'''


# class JsonToEggNode(BaseNode):
#     @classmethod
#     @node_definition(
#         inputs=[
#             NodeField(user_label='Egg as Json', label='egg_json', dtype='string', data=default_str)
#         ],
#         outputs=[
#             NodeField(label='Egg', dtype='basemodel')
#         ]
#     )
#     def exec(cls, egg_json: str):
#         return Egg.model_validate_json(egg_json)
    





    


# class Chicken(NamedBaseModel):
#     name: str
#     eggs: list[Egg]


# c1 = Chicken(name='Bantam', eggs=[
#     Egg(color='brown', diameter=2.5),
#     Egg(color='white', diameter=2.75)
# ])

# c2 = Chicken(name='Polly', eggs=[
#     Egg(color='blue', diameter=2.5),
#     Egg(color='green', diameter=2.75)
# ])

# class ChickenNameComboNode(BaseNode):
#     @classmethod
#     @node_definition(
#         inputs=[
#             NodeField(label='A', dtype='basemodel', data=c1),
#             NodeField(label='B', dtype='basemodel', data=c2)
#         ],
#         outputs=[
#             NodeField(label='name_combo', dtype='string')
#         ]
#     )
#     def exec(cls, A: Chicken, B: Chicken):
#         return f'{A.name} + {B.name}'

# from ..rhino.rhino_connection import get_polyline_redis


# class Polyline(NamedBaseModel):
#     points: list[list[float]]

# NodeField.class_options['Polyline'] = Polyline

# class GetPolylineRedisNode(BaseNode):
#     @classmethod
#     @node_definition(
#         inputs=[NodeField(label='redis_key', user_label='Redis Key', dtype='string', data='get_polyline')],
#         outputs=[NodeField(label='polyline', dtype='basemodel')]
#     )
#     def exec(cls, redis_key: str):
#         pts = get_polyline_redis(redis_key)
#         return Polyline.model_validate({'points': pts})