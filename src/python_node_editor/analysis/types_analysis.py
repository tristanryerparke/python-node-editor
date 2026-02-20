import inspect
import os
import types
import typing
from typing import Any, Dict, Set

from python_node_editor.schema import MultipleOutputs
from python_node_editor.schema_base import (
    CachedTypeDefModel,
    StructDescr,
    TypeDefModel,
    UnionDescr,
    UserModel,
    UserTypeDefModel,
)


def merge_types_dict(master_types, incoming_types):
    """Merge incoming types into a master types dictionary."""
    for type_name, type_schema in incoming_types.items():
        if type_name not in master_types:
            master_types[type_name] = type_schema


def get_type_repr(tp, module_ns, short_repr=True):
    """get a string representation of a type, returning StructDescr/UnionDescr instances for complex types"""
    if short_repr:
        # First try direct match
        for name, val in module_ns.items():
            if val is tp and name.isidentifier():
                return name

        # Try to find via attribute access (e.g., Image.Image for PIL.Image.Image)
        if hasattr(tp, "__name__") and hasattr(tp, "__module__"):
            # Check if any module in namespace has this class as an attribute
            for name, val in module_ns.items():
                if inspect.ismodule(val) and hasattr(val, tp.__name__):
                    if getattr(val, tp.__name__) is tp:
                        return tp.__name__  # Return just the class name (e.g., "Image")
    # Handle types.UnionType (int | float style)
    if isinstance(tp, types.UnionType):
        return UnionDescr(
            any_of=[
                get_type_repr(param, module_ns, short_repr) for param in tp.__args__
            ]
        )
    # Handle regular unions and user aliases (Union[int, float], Number = int | float)
    if hasattr(tp, "__origin__"):
        origin: Any = tp.__origin__
        # print(origin)
        if origin is typing.Union:
            return UnionDescr(
                any_of=[
                    get_type_repr(param, module_ns, short_repr) for param in tp.__args__
                ]
            )
        elif origin in (list, typing.List):
            return StructDescr(
                structure_type="list",
                items_type=get_type_repr(tp.__args__[0], module_ns, short_repr),
            )
        elif origin in (dict, typing.Dict):
            return StructDescr(
                structure_type="dict",
                items_type=get_type_repr(tp.__args__[1], module_ns, short_repr),
            )
        else:
            raise ValueError("Unknown origin", tp)
    if hasattr(tp, "__name__"):
        return tp.__name__
    return str(tp)


def analyze_type(
    tp: Any,
    file_path: str,
    module_ns: Dict[str, Any],
) -> Dict[str, Dict[str, Any]]:
    """Analyze a type and return a dict of type schemas for it and all constituent types."""
    types_dict: Dict[str, Dict[str, Any]] = {}
    found_types_set: Set[Any] = set()

    # Get absolute and relative file paths
    abs_file_path = os.path.abspath(file_path)
    try:
        rel_file_path = os.path.relpath(abs_file_path, os.getcwd())
    except ValueError:
        # If on different drives on Windows, use absolute path
        rel_file_path = abs_file_path

    def _add_type_recursive(t: Any):
        """Internal recursive function to build types_dict."""

        # Skip types that have already been processed
        if t in found_types_set:
            return
        found_types_set.add(t)

        # Skip types that derive from our special class MultipleOutputs
        if (
            inspect.isclass(t)
            and issubclass(t, MultipleOutputs)
            and t is not MultipleOutputs
        ):
            return

        # Special handling for typing.Any
        if t is typing.Any:
            if "Any" not in types_dict:
                type_def = TypeDefModel(kind="builtin")
                type_def._class = t
                types_dict["Any"] = type_def
            return

        # Handle types.UnionType (int | float syntax) - must come before builtin check
        if isinstance(t, types.UnionType):
            # Recursively add each constituent type of the union
            for arg in t.__args__:
                _add_type_recursive(arg)
            return

        # Cached types (detected by _is_cached_type marker)
        if inspect.isclass(t) and hasattr(t, "_is_cached_type"):
            # Try to find the name in the module namespace first
            type_name = None
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    type_name = name
                    break

            # If not found in module_ns, use the class's __name__
            if type_name is None:
                type_name = t.__name__

            if type_name not in types_dict:
                type_def = CachedTypeDefModel(
                    kind="user",
                    category=os.path.splitext(rel_file_path)[0]
                    .replace(os.sep, "/")
                    .split("/"),
                )
                type_def._class = t
                types_dict[type_name] = type_def
            return

        # Builtin type
        if inspect.isclass(t) and t.__module__ == "builtins":
            tname = t.__name__
            if tname not in types_dict:
                type_def = TypeDefModel(kind="builtin")
                type_def._class = t
                types_dict[tname] = type_def

        # User Model types(detected by derivation from our special UserModel class)
        elif inspect.isclass(t) and issubclass(t, UserModel) and t is not UserModel:
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    if name not in types_dict:
                        properties = None
                        if hasattr(t, "__annotations__") and t.__annotations__:
                            properties = {
                                field: get_type_repr(ftype, module_ns, short_repr=True)
                                for field, ftype in t.__annotations__.items()
                            }
                            # Recursively add field types
                            for field_type in t.__annotations__.values():
                                _add_type_recursive(field_type)

                        type_def = UserTypeDefModel(
                            kind="user_model",
                            category=os.path.splitext(rel_file_path)[0]
                            .replace(os.sep, "/")
                            .split("/"),
                            properties=properties,
                        )
                        type_def._class = t
                        types_dict[name] = type_def
                    break

        # Handle third-party classes (not builtin, not UserModel, not cached)
        elif inspect.isclass(t):
            # Try to find the name in the module namespace
            type_name = None
            for name, val in module_ns.items():
                if val is t and name.isidentifier():
                    type_name = name
                    break
            # Fallback: if the class is exposed as a module attribute
            if type_name is None and hasattr(t, "__name__"):
                for _, val in module_ns.items():
                    if inspect.ismodule(val) and hasattr(val, t.__name__):
                        if getattr(val, t.__name__) is t:
                            type_name = t.__name__
                            break

            # If found in module namespace but not a recognized type, it might be:
            # 1. A third-party type that will get a referenced_datamodel via decorator
            # 2. A user class that should inherit from UserModel (error case)
            if type_name is not None:
                # Add it as a cached type placeholder
                # The referenced_datamodel field will be added by functions_analysis.py if applicable
                if type_name not in types_dict:
                    type_def = CachedTypeDefModel(
                        kind="cached",
                        category=os.path.splitext(rel_file_path)[0]
                        .replace(os.sep, "/")
                        .split("/"),
                    )
                    type_def._class = t
                    types_dict[type_name] = type_def

        # Lists and dicts of user-defined types (e.g., list[int], dict[str, float])
        if hasattr(t, "__origin__") and hasattr(t, "__args__"):
            origin = getattr(t, "__origin__", None)
            # We only expect list/typing.List and dict/typing.Dict here; other generics should be handled above
            if origin in (list, typing.List):
                for arg in getattr(t, "__args__", ()):
                    _add_type_recursive(arg)
            elif origin in (dict, typing.Dict):
                for arg in getattr(t, "__args__", ()):
                    _add_type_recursive(arg)
            else:
                raise ValueError(f"No way to build a schema for this type: {origin}")

    _add_type_recursive(tp)
    return types_dict
