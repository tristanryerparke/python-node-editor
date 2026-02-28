from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    model_validator,
)

from python_node_editor.large_data.models import CachedDataWrapper
from python_node_editor.schema_base import (
    BASE_DATATYPES,
    CamelBaseModel,
    StructDescr,
    UnionDescr,
    UserModel,
)


# We don't want the fields on MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    pass


class DataWrapper(CamelBaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str | UnionDescr | StructDescr
    value: BASE_DATATYPES | None = None

    @field_serializer("value")
    def serialize_value(self, value: BASE_DATATYPES | None):
        """Usermodel subclasses need to get serialized normally.
        Dicts and lists need to be serialized recursively to handle nested UserModels."""
        if isinstance(value, UserModel):
            return value.model_dump()
        if isinstance(value, dict):
            return {
                k: v.model_dump() if isinstance(v, UserModel) else v
                for k, v in value.items()
            }
        if isinstance(value, list):
            return [
                item.model_dump() if isinstance(item, UserModel) else item
                for item in value
            ]
        return value


# We allow arbitrary types on FunctionAsNode for passing it around in the backend
# But callable is removed when we serialize it
class FunctionSchema(CamelBaseModel):
    name: str
    callable_id: str
    category: list[str]
    file_path: list[str | int]
    doc: str | None = None
    arguments: dict[str, DataWrapper | CachedDataWrapper]
    dynamic_input_type: StructDescr | None = None
    output_style: Literal["single", "multiple"] = "single"
    outputs: dict[str, DataWrapper | CachedDataWrapper]
    cached_types: list[str] = Field(default_factory=list)
    auto_generated: bool = False


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, DataWrapper | CachedDataWrapper]
    outputs: dict[str, DataWrapper | CachedDataWrapper]
    output_style: Literal["single", "multiple"] = "single"

    @model_validator(mode="before")
    @classmethod
    def reconstruct_cached_types(cls, data: Any) -> Any:
        """
        Pre-processes data before validation to instantiate cached data types.

        This validator:
        1. Detects cached data by the presence of a "$cacheKey:" marker in value
        2. Looks up the cached type in the TYPES registry
        3. Instantiates CachedDataWrapper to load from the cache
        4. Replaces the dict with the instance before Pydantic validates

        This allows 3rd party CachedDataWrapper subclasses to be properly instantiated
        without hardcoding union types in the schema.
        """
        from python_node_editor.server import TYPES

        # Pre-process: replace dicts with instantiated cached models BEFORE validation
        if isinstance(data, dict):
            arguments = data.get("arguments", {})
            for arg_name, arg_value in arguments.items():
                if (
                    isinstance(arg_value, dict)
                    and isinstance(arg_value.get("value"), str)
                    and arg_value["value"].startswith("$cacheKey:")
                ):
                    type_str = arg_value.get("type")
                    type_def = TYPES.get(type_str)

                    if type_def and type_def.kind == "cached":
                        from python_node_editor.large_data.models import CachedDataWrapper

                        cached_instance = CachedDataWrapper.model_validate(
                            arg_value, context={"populate_from_cache": True}
                        )
                        # Replace the dict with the instance in the data
                        arguments[arg_name] = cached_instance

        return data


class NodeFromFrontend(CamelBaseModel):
    id: str
    position: dict[str, float]
    data: NodeDataFromFrontend


class Edge(CamelBaseModel):
    id: str
    source: str
    source_handle: str
    target: str
    target_handle: str


class Graph(CamelBaseModel):
    nodes: list[NodeFromFrontend]
    edges: list[Edge]


class NodeUpdate(CamelBaseModel):
    """Represents an update to a node during execution."""

    node_id: str
    status: Literal["executing", "executed", "error"] | None = None
    outputs: dict[str, DataWrapper | CachedDataWrapper] | None = None
    arguments: dict[str, DataWrapper | CachedDataWrapper] | None = None
    terminal_output: str = ""

    @field_serializer("outputs", "arguments", when_used="unless-none")
    def serialize_wrappers(self, value, _info):
        """Custom serializer to ensure nested CachedDataWrapper subclasses properly serialize computed fields"""
        return {
            key: wrapper.model_dump(by_alias=True, exclude_none=True)
            for key, wrapper in value.items()
        }
