
import uuid
from pydantic import BaseModel, computed_field, Field
from devtools import debug as d
import json
from functools import cached_property
class MFData(BaseModel):
    payload: int
    # id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    @computed_field(return_type=str)
    @cached_property
    def id(self):
        return str(uuid.uuid4())


mfa = MFData(payload=2)
d(mfa)

mfa_as_json = mfa.model_dump_json()
d(json.loads(mfa_as_json))

# mfa_from_json = MFData.model_validate_json(mfa_as_json)


