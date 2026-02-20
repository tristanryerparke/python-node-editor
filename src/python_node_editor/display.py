from functools import wraps
from typing import Any, Callable, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])

# Import the progress context variable for flush_output_to_frontend
from python_node_editor.execution.context import progress_context


def add_node_options(
    node_name: str | None = None,
    return_value_name: str | None = None,
    list_inputs: bool = False,
    dict_inputs: bool = False,
    cached_types: list | None = None,
    cached_handlers: list | dict | None = None,
):
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        # Add the name attribute to the wrapper function if provided
        if node_name is not None:
            wrapper.node_name = node_name  # type: ignore
        if return_value_name is not None:
            wrapper.return_value_name = return_value_name  # type: ignore
        if list_inputs:
            wrapper.list_inputs = list_inputs  # type: ignore
        if dict_inputs:
            wrapper.dict_inputs = dict_inputs  # type: ignore
        if cached_types is not None:
            wrapper._type_datamodel_mappings = cached_types  # type: ignore
        if cached_handlers is not None:
            from python_node_editor.large_data.base import normalize_large_data_handlers

            existing = getattr(wrapper, "_large_data_handlers", None)
            merged = {**normalize_large_data_handlers(existing), **normalize_large_data_handlers(cached_handlers)}
            wrapper._large_data_handlers = merged  # type: ignore

        return cast(F, wrapper)

    return decorator


def flush_output_to_frontend(*args, **kwargs):
    """Print to stdout and trigger an execution update if in a node execution context.

    This function works like a normal print() call, but if called during node execution,
    it also triggers an incremental update to the frontend with the accumulated terminal output.

    Args:
        *args: Arguments to print (same as built-in print)
        **kwargs: Keyword arguments to print (same as built-in print)
    """
    # First, print normally (this goes to StringIO buffer if stdout is redirected)
    print(*args, **kwargs)

    # Then try to trigger a progress update
    context_dict = progress_context.get()
    if context_dict is not None:
        # Get callback from the context dict
        callback = context_dict.get("callback")
        if callback is not None:
            # Call the callback (reads buffer from the same dict)
            callback()
