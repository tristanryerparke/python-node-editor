
from devtools import debug

from pydantic import BaseModel

class Test(BaseModel):
    name: str
    age: int

debug(Test.model_json_schema())

t = Test(name='John', age=20)
debug(t)