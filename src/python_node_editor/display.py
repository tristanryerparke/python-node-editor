from functools import wraps
from typing import Any, Callable, TypeVar, cast

# Import the progress context variable for flush_output_to_frontend
from python_node_editor.execution.context import progress_context

F = TypeVar("F", bound=Callable[..., Any])
M = TypeVar("M", bound=type)


def _handlers_to_dict(handlers):
    if not handlers:
        return {}
    if isinstance(handlers, dict):
        return dict(handlers)
    return {handler.type_name: handler for handler in handlers}


def add_node_options(
    node_name: str | None = None,
    return_value_name: str | None = None,
    list_inputs: bool = False,
    dict_inputs: bool = False,
    post_hook: Callable[..., Any] | None = None,
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
        if post_hook is not None:
            wrapper.post_hook = post_hook  # type: ignore
        if cached_types is not None:
            wrapper._type_datamodel_mappings = cached_types  # type: ignore
        if cached_handlers is not None:
            existing = getattr(wrapper, "_large_data_handlers", None)
            merged = {**_handlers_to_dict(existing), **_handlers_to_dict(cached_handlers)}
            wrapper._large_data_handlers = merged  # type: ignore

        return cast(F, wrapper)

    return decorator


def add_model_options(
    construct_post_hook: Callable[..., Any] | None = None,
    deconstruct_post_hook: Callable[..., Any] | None = None,
):
    def decorator(model_class: M) -> M:
        from python_node_editor.schema_base import UserModel

        if not isinstance(model_class, type) or not issubclass(model_class, UserModel):
            raise TypeError("add_model_options can only decorate UserModel subclasses")

        if construct_post_hook is not None:
            model_class._construct_post_hook = construct_post_hook  # type: ignore[attr-defined]
        if deconstruct_post_hook is not None:
            model_class._deconstruct_post_hook = deconstruct_post_hook  # type: ignore[attr-defined]

        return model_class

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
