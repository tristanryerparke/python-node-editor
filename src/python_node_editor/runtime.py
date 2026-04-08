from functools import wraps
import inspect
import io
from contextlib import redirect_stderr, redirect_stdout


def skip_node(func):
    func._skip_node_analysis = True
    return func


def _append_hook(wrapper, attribute_name, hook):
    hooks = list(getattr(wrapper, attribute_name, []))
    hooks.append(hook)
    setattr(wrapper, attribute_name, hooks)


def pre_execution_hook(hook, include_terminal_output: bool = True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        _append_hook(
            wrapper,
            "_pre_execution_hooks",
            {
                "hook": hook,
                "include_terminal_output": include_terminal_output,
            },
        )
        return wrapper

    return decorator


def post_execution_hook(hook):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        _append_hook(wrapper, "_post_execution_hooks", hook)
        return wrapper

    return decorator


def _call_hook_with_subset_context(hook, context):
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


def _run_hooks(hooks, context):
    if hooks is None:
        return

    if callable(hooks):
        hooks = [hooks]

    for hook in hooks:
        hook_callable = hook
        include_terminal_output = True
        if isinstance(hook, dict):
            hook_callable = hook.get("hook")
            include_terminal_output = hook.get("include_terminal_output", True)

        if not callable(hook_callable):
            continue

        if include_terminal_output:
            _call_hook_with_subset_context(hook_callable, context)
            continue

        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            _call_hook_with_subset_context(hook_callable, context)


def run_pre_execution_hooks(func, execution_id, node_id, inputs):
    _run_hooks(
        getattr(func, "_pre_execution_hooks", None),
        {
            "execution_id": execution_id,
            "node_id": node_id,
            "inputs": inputs,
        },
    )


def run_post_execution_hooks(func, execution_id, node_id, inputs, output):
    _run_hooks(
        getattr(func, "_post_execution_hooks", None),
        {
            "execution_id": execution_id,
            "node_id": node_id,
            "inputs": inputs,
            "output": output,
        },
    )
