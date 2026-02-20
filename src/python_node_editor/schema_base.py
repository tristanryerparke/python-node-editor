from typing import ClassVar, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, PrivateAttr
from pydantic.alias_generators import to_camel


class UserModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # These are flags used to indicate whether a construct/deconstruct node should be generated for subclasses of the model
    _deconstruct_node: ClassVar[bool] = True
    _construct_node: ClassVar[bool] = True


VALID_BUILTIN_CLASSES = (int, float, str, list, dict)
VALID_BUILTINS: TypeAlias = int | float | str
STRUCTURED_TYPES: TypeAlias = list[VALID_BUILTINS] | dict[str, VALID_BUILTINS]
BASE_DATATYPES: TypeAlias = VALID_BUILTINS | UserModel | STRUCTURED_TYPES


class CamelBaseModel(BaseModel):
    """The frontend uses camel case for its keys, this class handles
    automatic serialization and deserialization to and from camel case"""

    model_config = ConfigDict(
        alias_generator=to_camel,
        serialize_by_alias=True,
        populate_by_name=True,
    )


class UnionDescr(CamelBaseModel):
    any_of: list[str]


class StructDescr(CamelBaseModel):
    structure_type: Literal["list", "dict"]
    items_type: str | UnionDescr


class TypeDefModel(CamelBaseModel):
    """basic structure for type definitions, _class does not get serialized"""

    kind: str
    _class: type | None = PrivateAttr(default=None)


class UserTypeDefModel(TypeDefModel):
    """Type definition for user-defined models with properties"""

    category: list[str]
    properties: dict[str, str | StructDescr | UnionDescr] | None = None


class CachedTypeDefModel(TypeDefModel):
    """Type definition for cached types"""

    category: list[str]
    _referenced_datamodel: type | None = PrivateAttr(default=None)
