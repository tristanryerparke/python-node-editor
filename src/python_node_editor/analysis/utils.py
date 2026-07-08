import importlib
import importlib.util
import inspect
import os
import sys
from types import ModuleType
from typing import Any

from python_node_editor.plugins import missing_plugin_error_from_module_not_found

from .cluster_analysis import analyze_pnejson_clusters, find_pnejson_files
from .functions_analysis import analyze_function
from .types_analysis import merge_types_dict
from .user_model_functions import create_const_deconst_models


class DuplicateFunctionError(Exception):
    pass


class FunctionNotFoundError(Exception):
    pass


def should_skip_function(func_obj) -> bool:
    current_obj = func_obj
    while current_obj is not None:
        if getattr(current_obj, "_skip_node_analysis", False):
            return True
        current_obj = getattr(current_obj, "__wrapped__", None)
    return False


def split_search_path_and_function(search_path: str) -> tuple[str, str | None]:
    if ":" not in search_path:
        return search_path, None

    path_part, function_name = search_path.rsplit(":", 1)
    if path_part.endswith(".py") and function_name:
        return path_part, function_name

    return search_path, None


def check_for_duplicate_callable_ids(functions_schemas_list: list[Any]) -> None:
    callable_id_to_functions = {}

    for func_schema in functions_schemas_list:
        callable_id = func_schema.callable_id

        if callable_id in callable_id_to_functions:
            callable_id_to_functions[callable_id].append(func_schema)
        else:
            callable_id_to_functions[callable_id] = [func_schema]

    duplicates = {
        callable_id: funcs
        for callable_id, funcs in callable_id_to_functions.items()
        if len(funcs) > 1
    }

    if duplicates:
        error_messages = []
        for callable_id, funcs in duplicates.items():
            func_names = [f"{f.name} ({f.definition_path})" for f in funcs]
            error_messages.append(
                f"Callable ID '{callable_id}' is shared by: {', '.join(func_names)}"
            )
        raise DuplicateFunctionError(
            "Duplicate function(s) found:\n" + "\n".join(error_messages)
        )


def find_python_files(
    target_path: str, ignore_underscore_prefix: bool = True
) -> list[str]:
    """Find all Python files to analyze.

    Args:
        target_path: Path to a file or directory
        ignore_underscore_prefix: If True, ignore files/folders starting with underscore

    Returns:
        List of Python file paths to analyze
    """
    py_files = []

    if os.path.isdir(target_path):
        # Recursively find all .py files in the directory
        for root, dirs, files in os.walk(target_path):
            # Filter out directories starting with underscore if ignoring
            if ignore_underscore_prefix:
                dirs[:] = [d for d in dirs if not d.startswith("_")]

            for file in files:
                if file.endswith(".py"):
                    # Skip files starting with underscore if ignoring
                    if ignore_underscore_prefix and file.startswith("_"):
                        continue
                    py_files.append(os.path.join(root, file))
    elif target_path.endswith(".py"):
        # Single file
        py_files = [target_path]

    return py_files


def analyze_file(
    file_path: str,
    function_names: set[str] | None = None,
    ignore_underscore_prefix: bool = True,
):
    """Analyze a single file for functions that can be turned into nodes.
    Also collects the input and output types of the functions and returns them."""

    # Import the module from file path
    module_name = os.path.splitext(os.path.basename(file_path))[0]
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load spec for {file_path}")

        module: ModuleType = importlib.util.module_from_spec(spec)
        # Add to sys.modules to handle potential circular imports
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
    except ModuleNotFoundError as e:
        plugin_error = missing_plugin_error_from_module_not_found(e)
        if plugin_error is not None:
            print(f"Module '{file_path}' could not be imported: {plugin_error}")
        else:
            print(f"Module '{file_path}' could not be imported: {e}")
        return [], {}, {}
    except Exception as e:
        print(f"Module '{file_path}' could not be imported: {e}")
        return [], {}, {}

    # Find all functions in the module
    funcs = {
        name: obj
        for name, obj in inspect.getmembers(module, inspect.isfunction)
        if (obj.__module__ == module_name or obj.__module__ == module.__name__)
        and (not ignore_underscore_prefix or not name.startswith("_"))
        and not should_skip_function(obj)
    }

    if function_names is not None:
        missing_function_names = function_names.difference(funcs.keys())
        if missing_function_names:
            missing_sorted = ", ".join(sorted(missing_function_names))
            raise FunctionNotFoundError(
                f"The function(s) {missing_sorted} do not exist in {file_path}"
            )
        funcs = {name: obj for name, obj in funcs.items() if name in function_names}

    functions_schemas_list = []
    callables_dict = {}
    types_dict = {}

    # Analyze each function and populate the dictionaries
    for func_name, func_obj in funcs.items():
        callable_id, func_schema, callable_obj, func_types = analyze_function(func_obj)

        # Store the function schema
        functions_schemas_list.append(func_schema)

        # Store the callable by its ID
        callables_dict[callable_id] = callable_obj

        # Merge the types found in this function into the file's types_dict
        merge_types_dict(types_dict, func_types)

    return functions_schemas_list, callables_dict, types_dict


def analyze_files(
    py_files_with_function_filters: list[tuple[str, set[str] | None]],
    base_dir: str,
    ignore_underscore_prefix: bool = True,
    pnejson_files: list[str] | None = None,
):
    """Takes in files and analyzes node functions plus .pnejson clusters."""
    # Initialize accumulation structures
    all_function_schemas = []
    all_callables = {}
    all_types = {}

    # Add the base directory to sys.path
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    for py_file, function_names in py_files_with_function_filters:
        # print(f"Analyzing {py_file}:")

        # Analyze the file
        file_functions, file_callables, file_types = analyze_file(
            py_file,
            function_names=function_names,
            ignore_underscore_prefix=ignore_underscore_prefix,
        )

        # Merge functions schemas from this file
        all_function_schemas.extend(file_functions)

        # Merge callables from this file
        for callable_id, callable_obj in file_callables.items():
            all_callables[callable_id] = callable_obj

        # Merge types from this file
        merge_types_dict(all_types, file_types)

    const_deconst_model_schemas, const_deconst_callables = create_const_deconst_models(
        all_types
    )

    # Merge the constructor/deconstructor schemas and callables before clusters,
    # so saved flows can depend on generated user-model helper nodes too.
    all_function_schemas.extend(const_deconst_model_schemas)
    all_callables.update(const_deconst_callables)

    if pnejson_files:
        cluster_schemas, cluster_callables = analyze_pnejson_clusters(
            pnejson_files,
            base_dir=base_dir,
            available_callables=all_callables,
        )
        all_function_schemas.extend(cluster_schemas)
        all_callables.update(cluster_callables)

    # Check for duplicate callable_ids
    check_for_duplicate_callable_ids(all_function_schemas)

    return all_function_schemas, all_callables, all_types


def analyze_file_structure(
    search_paths: str | list[str], ignore_underscore_prefix: bool = True
):
    if isinstance(search_paths, str):
        search_paths = [search_paths]

    py_files_with_function_filters = {}
    pnejson_files = []
    base_dirs = set()

    for search_path in search_paths:
        path_part, function_name = split_search_path_and_function(search_path)

        py_files = find_python_files(path_part, ignore_underscore_prefix)
        found_pnejson_files = find_pnejson_files(path_part, ignore_underscore_prefix)
        if function_name is not None and len(py_files) != 1:
            raise ValueError(
                "Function selectors are only supported for a single Python file path"
            )
        if function_name is not None and found_pnejson_files:
            raise ValueError("Function selectors are not supported for .pnejson files")

        for py_file in py_files:
            current_filter = py_files_with_function_filters.get(py_file)
            if current_filter is None and py_file in py_files_with_function_filters:
                continue
            if function_name is None:
                py_files_with_function_filters[py_file] = None
                continue
            if current_filter is None:
                py_files_with_function_filters[py_file] = {function_name}
            else:
                current_filter.add(function_name)

        for pnejson_file in found_pnejson_files:
            if pnejson_file not in pnejson_files:
                pnejson_files.append(pnejson_file)

        if os.path.isdir(path_part):
            base_dirs.add(os.path.dirname(path_part))
        else:
            base_dirs.add(os.path.dirname(path_part))

    # Use the common base directory or the first one
    base_dir = (
        os.path.commonpath(list(base_dirs))
        if len(base_dirs) > 1
        else list(base_dirs)[0]
    )

    # Keep repo-root style absolute imports working when analyzing files inside
    # nested folders.
    cwd = os.path.abspath(os.getcwd())
    if cwd not in sys.path:
        sys.path.insert(0, cwd)

    return analyze_files(
        list(py_files_with_function_filters.items()),
        base_dir,
        ignore_underscore_prefix=ignore_underscore_prefix,
        pnejson_files=pnejson_files,
    )
