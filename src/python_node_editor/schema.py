from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    model_validator,
)

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
    definition_path: str
    doc: str | None = None
    arguments: dict[str, DataWrapper]
    dynamic_input_type: StructDescr | None = None
    output_style: Literal["single", "multiple"] = "single"
    outputs: dict[str, DataWrapper]
    cached_types: list[str] = Field(default_factory=list)
    auto_generated: bool = False


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, DataWrapper]
    outputs: dict[str, DataWrapper]
    output_style: Literal["single", "multiple"] = "single"

    @model_validator(mode="before")
    @classmethod
    def reconstruct_cached_types(cls, data: Any) -> Any:
        """
        Pre-processes cached values into backend canonical
        {instance_type, cache_key, ...} shape.
        CamelBaseModel handles camelCase <-> snake_case conversion.
        """
        from python_node_editor.large_data.models import normalize_cached_value_reference
        from python_node_editor.server import TYPES

        if not isinstance(data, dict):
            return data

        arguments = data.get("arguments")
        if not isinstance(arguments, dict):
            return data

        data_changed = False
        normalized_arguments = dict(arguments)
        for arg_name, arg_value in arguments.items():
            if not isinstance(arg_value, dict):
                continue

            type_str = arg_value.get("type")
            if not isinstance(type_str, str):
                continue

            type_def = TYPES.get(type_str)
            if not type_def or type_def.kind != "cached":
                continue

            normalized_value = normalize_cached_value_reference(
                arg_value.get("value"), expected_type=type_str
            )
            if normalized_value is None:
                continue

            updated_wrapper = dict(arg_value)
            updated_wrapper["value"] = normalized_value
            normalized_arguments[arg_name] = updated_wrapper
            data_changed = True

        if data_changed:
            data = dict(data)
            data["arguments"] = normalized_arguments

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
    outputs: dict[str, DataWrapper] | None = None
    arguments: dict[str, DataWrapper] | None = None
    terminal_output: str = ""

    @field_serializer("outputs", "arguments", when_used="unless-none")
    def serialize_wrappers(self, value, _info):
        """Serialize nested wrapper models with aliases and without null fields."""
        return {
            key: wrapper.model_dump(by_alias=True, exclude_none=True)
            for key, wrapper in value.items()
        }
