import hashlib
import inspect
import os
import typing
from typing import Any, Callable, Dict, Tuple

from python_node_editor.schema import DataWrapper, FunctionSchema, StructDescr

from .types_analysis import analyze_type, get_type_repr, merge_types_dict


class ParameterNotTypeAnnotated(Exception):
    pass


def analyze_function(
    func_obj: Callable,
) -> Tuple[str, FunctionSchema, Callable, Dict[str, Any]]:
    """Analyze a function with the inspect module and returns:
     - A generated id for referencing the function
     - A schema describing the function for sending to the frontend and creating the node in the UI
     - The original function object, for when we want to call it with arguments sent from the frontend
     - A dictionary of type schemas found in the function's argument and return
    type annotations for sending to the frontend

    """

    # If function is wrapped by a decorator (like @add_node_options), retrieve the original function object
    original_func = func_obj
    while hasattr(original_func, "__wrapped__"):
        original_func = getattr(original_func, "__wrapped__")

    # Get file path and module namespace from the function object
    file_path = inspect.getfile(original_func)
    abs_file_path = os.path.abspath(file_path)
    module_ns = original_func.__globals__

    # Get the line number where the function is defined
    line_number = inspect.getsourcelines(original_func)[1]

    # Get relative path from current working directory
    try:
        rel_file_path = os.path.relpath(abs_file_path, os.getcwd())
    except ValueError:
        # If on different drives on Windows, use absolute path
        rel_file_path = abs_file_path

    # Inspect the function
    sig = inspect.signature(func_obj)
    type_hints = typing.get_type_hints(func_obj, module_ns, module_ns)

    # Local dict for types found in this function
    found_types: Dict[str, Any] = {}

    # Get the input arguments schema of the function and register the types
    arguments = {}
    dynamic_input_type = None
    for arg in sig.parameters.values():
        # =========== PARSE POSITIONAL ARGUMENT TYPE ANNOTATIONS ===========
        # Some functions may accept a variable number of arguments, but they still need to be typed
        # Those types need to be registered
        # Handle *args parameter - extract its type for list_inputs
        if arg.kind == inspect.Parameter.VAR_POSITIONAL:
            ann = type_hints.get(arg.name, arg.annotation)
            if ann is inspect.Parameter.empty:
                raise ParameterNotTypeAnnotated(
                    f"Parameter *{arg.name} has no annotation"
                )
            dynamic_input_type = StructDescr(
                structure_type="list",
                items_type=get_type_repr(ann, module_ns, short_repr=True),  # type: ignore[arg-type]
            )
            # Analyze the argument type and merge with found types
            arg_types = analyze_type(ann, file_path, module_ns)
            merge_types_dict(found_types, arg_types)
            continue

        # Handle **kwargs parameter - extract its type for dict_inputs
        if arg.kind == inspect.Parameter.VAR_KEYWORD:
            ann = type_hints.get(arg.name, arg.annotation)
            if ann is inspect.Parameter.empty:
                raise ParameterNotTypeAnnotated(
                    f"Parameter **{arg.name} has no annotation"
                )
            dynamic_input_type = StructDescr(
                structure_type="dict",
                items_type=get_type_repr(ann, module_ns, short_repr=True),  # type: ignore[arg-type]
            )
            # Analyze the argument type and merge with found types
            arg_types = analyze_type(ann, file_path, module_ns)
            merge_types_dict(found_types, arg_types)
            continue

        # =========== PARSE NORMAL TYPE ANNOTATIONS ===========
        ann = type_hints.get(arg.name, arg.annotation)
        # Force the user to type annotate!
        if ann is inspect.Parameter.empty:
            raise ParameterNotTypeAnnotated(f"Parameter {arg.name} has no annotation")

        arg_value = arg.default if arg.default is not inspect.Parameter.empty else None
        arg_entry = DataWrapper(
            type=get_type_repr(ann, module_ns, short_repr=True),  # type: ignore[arg-type]
            value=arg_value,
        )

        arguments[arg.name] = arg_entry

        # Analyze the argument type and merge with found types
        arg_types = analyze_type(ann, file_path, module_ns)
        merge_types_dict(found_types, arg_types)

    # Handle return type and detect multiple outputs
    ret_ann = type_hints.get("return", sig.return_annotation)
    if ret_ann is inspect.Signature.empty:
        raise Exception(f"Function {func_obj.__name__} has no return annotation")

    # Detect output fields from BaseModel subclasses with multiple outputs
    # Having the output_style flag lets a user potentially have an output (of multiple)
    # named "return" without breaking the app
    # Skip cached types - they should be treated as single outputs
    outputs = {}
    if (
        inspect.isclass(ret_ann)
        and hasattr(ret_ann, "model_fields")
        and not hasattr(ret_ann, "_is_cached_type")
    ):
        # Get the model fields using Pydantic's model_fields
        output_style = "multiple"
        for field_name, field_info in ret_ann.model_fields.items():
            if field_info.annotation is not None:
                output_entry = DataWrapper(
                    type=get_type_repr(  # type: ignore[arg-type]
                        field_info.annotation, module_ns, short_repr=True
                    ),
                    value=None,
                )

                outputs[field_name] = output_entry

                # Analyze the output field type and merge with found types
                field_types = analyze_type(field_info.annotation, file_path, module_ns)
                merge_types_dict(found_types, field_types)

    # Basic single output
    else:
        output_style = "single"
        # Check if function has a custom return_value_name from decorator
        return_value_name_temp = getattr(func_obj, "return_value_name", None)
        output_key = return_value_name_temp if return_value_name_temp else "return"
        output_entry = DataWrapper(
            type=get_type_repr(ret_ann, module_ns, short_repr=True),  # type: ignore[arg-type]
            value=None,
        )

        outputs[output_key] = output_entry

    # Analyze the return type and merge found types
    ret_types = analyze_type(ret_ann, file_path, module_ns)
    merge_types_dict(found_types, ret_types)

    # Apply type-to-datamodel mappings from decorator
    if hasattr(func_obj, "_type_datamodel_mappings"):
        mappings = func_obj._type_datamodel_mappings
        # mappings is a list of dicts like [{"argument_type": Image, "associated_datamodel": SomeDataModel}]
        for mapping in mappings:
            argument_type = mapping.get("argument_type")
            associated_datamodel = mapping.get("associated_datamodel")

            if argument_type is None or associated_datamodel is None:
                continue

            # Find the type name for this argument_type class in found_types
            type_name = get_type_repr(argument_type, module_ns, short_repr=True)

            if type_name in found_types:
                type_def = found_types[type_name]
                # Set _referenced_datamodel on the CachedTypeDefModel instance
                if hasattr(type_def, "_referenced_datamodel"):
                    type_def._referenced_datamodel = associated_datamodel

    # Validate any cached handlers defined on the function
    from python_node_editor.large_data.base import get_large_data_handlers

    handlers = get_large_data_handlers(func_obj)
    cached_types = list(handlers.keys())
    if handlers:
        for type_name, handler_spec in handlers.items():
            match_type = handler_spec.match_type
            if match_type is not None:
                resolved_name = get_type_repr(match_type, module_ns, short_repr=True)
                if resolved_name != type_name:
                    raise ValueError(
                        f"Cached handler type_name {type_name} does not match "
                        f"match_type {resolved_name}"
                    )
            if type_name not in found_types:
                raise ValueError(
                    f"Cached handler type_name {type_name} not found in function annotations"
                )
            type_def = found_types[type_name]
            if hasattr(type_def, "kind") and type_def.kind != "cached":
                raise ValueError(
                    f"Cached handler type_name {type_name} is not registered as a cached type"
                )

    # Generate callable_id by hashing the function's source code
    source_code = inspect.getsource(original_func)
    hash_digest = hashlib.sha256(source_code.encode()).hexdigest()
    callable_id = hash_digest[:16]

    # Check if the function has a custom node_name attribute from decorator
    func_name = getattr(func_obj, "node_name", func_obj.__name__)

    # Create category from relative path (without extension)
    category_path = os.path.splitext(rel_file_path)[0].replace(os.sep, "/").split("/")

    return (
        callable_id,
        FunctionSchema(
            name=func_name,
            callable_id=callable_id,
            category=category_path,
            file_path=[abs_file_path, line_number],
            doc=inspect.getdoc(func_obj),
            arguments=arguments,
            output_style=output_style,
            outputs=outputs,
            dynamic_input_type=dynamic_input_type,
            cached_types=cached_types,
        ),
        func_obj,
        found_types,
    )
