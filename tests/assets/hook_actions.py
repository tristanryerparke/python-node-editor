from python_node_editor.runtime import add_hook, delete_hook

HOOK_ACTION_EVENTS = []


def reset_hook_action_events():
    HOOK_ACTION_EVENTS.clear()


def on_add(action, node_id, callable_id) -> None:
    HOOK_ACTION_EVENTS.append(
        (
            "add",
            {
                "action": action,
                "node_id": node_id,
                "callable_id": callable_id,
            },
        )
    )


def on_delete(action, node_id, callable_id) -> None:
    HOOK_ACTION_EVENTS.append(
        (
            "delete",
            {
                "action": action,
                "node_id": node_id,
                "callable_id": callable_id,
            },
        )
    )


@add_hook(on_add)
@delete_hook(on_delete)
def add_with_lifecycle_hooks(a: int, b: int) -> int:
    return a + b
