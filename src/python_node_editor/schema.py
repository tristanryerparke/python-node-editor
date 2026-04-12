from typing import Any, Callable, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    PrivateAttr,
    ValidationError,
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
from python_node_editor.large_data.large_files_endpoint import CachedValueReference


# We don't want the fields on MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    pass


class DataWrapper(CamelBaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str | UnionDescr | StructDescr
    value: BASE_DATATYPES | CachedValueReference | None = None

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


HookKey = Literal["add", "pre", "post", "delete"]


class HookDefinition(CamelBaseModel):
    name: str

    _callable: Callable[..., Any] | None = PrivateAttr(default=None)

    @classmethod
    def from_callable(cls, hook: Callable[..., Any]) -> "HookDefinition":
        hook_definition = cls(
            name=getattr(hook, "__name__", hook.__class__.__name__)
        )
        hook_definition._callable = hook
        return hook_definition

    @property
    def hook_callable(self) -> Callable[..., Any] | None:
        return self._callable


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
    hooks: dict[HookKey, list[HookDefinition]] = Field(default_factory=dict)
    auto_generated: bool = False


class HookActionMessage(CamelBaseModel):
    action: Literal["add", "delete"]
    node_id: str
    callable_id: str


class NodeDataFromFrontend(CamelBaseModel):
    callable_id: str
    arguments: dict[str, DataWrapper]
    outputs: dict[str, DataWrapper]
    output_style: Literal["single", "multiple"] = "single"

    @model_validator(mode="after")
    def reconstruct_cached_types(self):
        from python_node_editor.server import CALLABLES, TYPES
        from python_node_editor.large_data.large_files_endpoint import LARGE_DATA_CACHE

        func_obj = CALLABLES.get(self.callable_id)
        handlers = getattr(func_obj, "_large_data_handlers", {}) or {}

        for arg_name, arg in self.arguments.items():
            if isinstance(arg.type, str):
                type_def = TYPES.get(arg.type)
                if (
                    type_def is not None
                    and type_def.kind == "user_model"
                    and type_def._class is not None
                    and isinstance(arg.value, dict)
                ):
                    try:
                        arg.value = type_def._class.model_validate(arg.value)
                    except ValidationError as exc:
                        raise ValueError(
                            f"Invalid value for argument '{arg_name}' of type '{arg.type}'"
                        ) from exc

            if not handlers or arg.type not in handlers:
                continue
            if not isinstance(arg.value, dict):
                continue

            cache_key = arg.value.get("cacheKey")
            if isinstance(cache_key, str) and cache_key in LARGE_DATA_CACHE:
                arg.value = LARGE_DATA_CACHE[cache_key]

        return self


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
