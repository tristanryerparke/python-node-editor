def skip_node(func):
    func._skip_node_analysis = True
    return func


def _append_hook(func, attribute_name, hook):
    hooks = list(getattr(func, attribute_name, []))
    hooks.append(hook)
    setattr(func, attribute_name, hooks)


def pre_execution_hook(hook):
    def decorator(func):
        _append_hook(func, "_pre_execution_hooks", hook)
        return func

    return decorator


def post_execution_hook(hook):
    def decorator(func):
        _append_hook(func, "_post_execution_hooks", hook)
        return func

    return decorator
