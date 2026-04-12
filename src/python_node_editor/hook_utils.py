import inspect
from typing import Any, Callable


def get_function_schema(callable_id):
    from python_node_editor.server import FUNCTION_SCHEMAS

    for function_schema in FUNCTION_SCHEMAS:
        if function_schema.callable_id == callable_id:
            return function_schema

    return None


def get_execution_hooks(callable_id, hook_name):
    function_schema = get_function_schema(callable_id)
    if function_schema is None:
        return []

    hook_definitions = function_schema.hooks.get(hook_name, [])
    return [
        hook_definition.hook_callable
        for hook_definition in hook_definitions
        if hook_definition.hook_callable is not None
    ]


def call_hook_with_subset_context(
    hook: Callable[..., Any], context: dict[str, Any]
) -> None:
    signature = inspect.signature(hook)
    args = []
    kwargs = {}
    consumed_names = set()
    has_var_keyword = False

    for parameter in signature.parameters.values():
        parameter_name = parameter.name
        if parameter.kind == inspect.Parameter.VAR_KEYWORD:
            has_var_keyword = True
            continue
        if parameter.kind == inspect.Parameter.VAR_POSITIONAL:
            continue

        if parameter_name in context:
            if parameter.kind == inspect.Parameter.POSITIONAL_ONLY:
                args.append(context[parameter_name])
            else:
                kwargs[parameter_name] = context[parameter_name]
            consumed_names.add(parameter_name)
            continue

        if parameter.default is inspect.Parameter.empty:
            supported_names = ", ".join(context.keys())
            raise TypeError(
                f"Hook '{hook.__name__}' has unsupported required parameter '{parameter_name}'. "
                f"Supported parameter names are: {supported_names}"
            )

    if has_var_keyword:
        for key, value in context.items():
            if key in consumed_names:
                continue
            kwargs[key] = value

    hook(*args, **kwargs)


def run_schema_hooks(callable_id, hook_name, context):
    for hook_callable in get_execution_hooks(callable_id, hook_name):
        call_hook_with_subset_context(hook_callable, context)
