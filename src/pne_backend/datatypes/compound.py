
from typing import List, ClassVar
from pydantic import BaseModel, model_validator

from ..base_data import SendableDataModel, BaseData
from ..field import DATATYPE_REGISTRY, instantiate_data_class


class ListData(SendableDataModel):
    payload: List[BaseData]

    datatype_registry: ClassVar[dict] = DATATYPE_REGISTRY

    @model_validator(mode='before')
    def validate_data(cls, values):
        new_data = []
        for item in values['payload']:
            new_data.append(instantiate_data_class(item, cls.datatype_registry))
        values['payload'] = new_data
        return values
