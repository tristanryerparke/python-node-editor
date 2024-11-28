from pydantic import BaseModel, model_validator

class NamedBaseModel(BaseModel):
    '''Named base model, adds its own class name to the serialized data so 
    that the frontend can perform specific actions like custom display'''
    class_name: str

    @model_validator(mode='before')
    @classmethod
    def load_cached_data(cls, values):
        values['class_name'] = cls.__name__
        return values