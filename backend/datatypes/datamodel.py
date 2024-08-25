from pydantic import BaseModel
from typing import Literal

class BaseModel(BaseModel):
    class Config:
        arbitrary_types_allowed = True