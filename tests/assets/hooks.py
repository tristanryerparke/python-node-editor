from python_node_editor.display import add_node_options
from python_node_editor.runtime import post_execution_hook, pre_execution_hook

HOOK_EVENTS = []


def reset_hook_events():
    HOOK_EVENTS.clear()


def pre_inputs_only(inputs) -> None:
    HOOK_EVENTS.append(("pre_inputs_only", {"inputs": dict(inputs)}))


def pre_full_context(execution_id, node_id, inputs) -> None:
    HOOK_EVENTS.append(
        (
            "pre_full_context",
            {
                "execution_id": execution_id,
                "node_id": node_id,
                "inputs": dict(inputs),
            },
        )
    )


def post_inputs_output(inputs, output) -> None:
    HOOK_EVENTS.append(
        (
            "post_inputs_output",
            {
                "inputs": dict(inputs),
                "output": output,
            },
        )
    )


def post_full_context(execution_id, node_id, inputs, output) -> None:
    HOOK_EVENTS.append(
        (
            "post_full_context",
            {
                "execution_id": execution_id,
                "node_id": node_id,
                "inputs": dict(inputs),
                "output": output,
            },
        )
    )


@add_node_options(node_name="Hooked Add", return_value_name="sum")
@pre_execution_hook(pre_inputs_only)
@post_execution_hook(post_full_context)
def add_with_hooked_options(a: int, b: int) -> int:
    return a + b


@pre_execution_hook(pre_full_context)
@post_execution_hook(post_inputs_output)
@add_node_options(node_name="Hooked Multiply", return_value_name="product")
def multiply_with_hooked_options(a: int, b: int) -> int:
    return a * b
