from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    field_serializer,
    model_validator,
)

from python_node_editor.large_data.base import CachedDataWrapper
from python_node_editor.schema_base import (
    BASE_DATATYPES,
    CamelBaseModel,
    StructDescr,
    UnionDescr,
    UserModel,
)


# We don't want the fields on MultipleOutputs to be converted to camel case
class MultipleOutputs(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
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
        2. Looks up the referenced_datamodel class from the TYPES registry
        3. Pre-instantiates the proper 3rd party datamodel instances
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
                        datamodel_class = type_def._referenced_datamodel
                        if datamodel_class:
                            # Create properly typed instance with context
                            cached_instance = datamodel_class.model_validate(
                                arg_value, context={"populate_from_cache": True}
                            )
                            # Replace the dict with the instance in the data
                            arguments[arg_name] = cached_instance

            # Also handle builtin_subclass types dynamically
            cls._reconstruct_builtin_subclass_types(arguments)

        return data

    @classmethod
    def _reconstruct_builtin_subclass_types(cls, data_dict: dict) -> None:
        """Helper method to dynamically reconstruct builtin_subclass types."""
        from python_node_editor.server import TYPES

        for key, value in list(data_dict.items()):
            if isinstance(value, dict):
                type_info = value.get("type")
                value_data = value.get("value")

                # Handle simple builtin_subclass types
                if (
                    isinstance(type_info, str)
                    and type_info in TYPES
                    and TYPES[type_info].kind == "builtin_subclass"
                ):
                    type_def = TYPES[type_info]
                    # Get the actual class to instantiate
                    target_class = type_def._class

                    if target_class and isinstance(value_data, str):
                        # Create instance of the actual class
                        instance = target_class(value_data)
                        data_dict[key] = instance

                # Handle list types with builtin_subclass items
                elif (
                    isinstance(type_info, dict)
                    and type_info.get("structureType") == "list"
                    and isinstance(type_info.get("itemsType"), str)
                    and type_info["itemsType"] in TYPES
                    and TYPES[type_info["itemsType"]].kind == "builtin_subclass"
                ):
                    list_value = value.get("value", [])
                    if isinstance(list_value, list):
                        items_type = type_info["itemsType"]
                        target_class = TYPES[items_type]._class

                        if target_class:
                            # Convert each string to the appropriate class instance
                            converted_list = [
                                target_class(item) if isinstance(item, str) else item
                                for item in list_value
                            ]
                            data_dict[key] = {"type": "list", "value": converted_list}


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
