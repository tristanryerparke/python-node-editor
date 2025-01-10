from typing import List, ClassVar, Union, Dict, ForwardRef, Literal
from pydantic import BaseModel, Field, model_validator
import uuid
from ..base_data import SendableDataModel, BaseData
from ..field import DATATYPE_REGISTRY, instantiate_data_class
from devtools import debug as d


class ListData(SendableDataModel):
    payload: List[Union[BaseData, 'ListData', 'ModelData']] = Field(discriminator='class_name')

    datatype_registry: ClassVar[dict] = DATATYPE_REGISTRY

    @model_validator(mode='before')
    @classmethod
    def validate_payload(cls, input_values, info):
        if not isinstance(input_values, dict):
            print(f'list creation: input_values is not a dict: {input_values}')
            raise ValueError('Input values must be a dictionary')

        # Instantiate the sub-items if we are deserializing from JSON
        new_data = []
        for item in input_values['payload']:
            if isinstance(item, dict):
                new_data.append(instantiate_data_class(item, cls.datatype_registry))
            else:
                new_data.append(item)
        input_values['payload'] = new_data

        # Generate a new ID if not provided
        if not input_values.get('id'):
            input_values['id'] = str(uuid.uuid4())

        return input_values

class ModelData(SendableDataModel):
    class_parent: str = 'ModelData'

    datatype_registry: ClassVar[dict] = DATATYPE_REGISTRY

    @model_validator(mode='before')
    @classmethod
    def validate_data(cls, input_values):
        return input_values



    

