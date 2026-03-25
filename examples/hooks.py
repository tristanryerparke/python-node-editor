from python_node_editor.display import add_node_options
from python_node_editor.runtime import post_execution_hook, pre_execution_hook, skip_node


@skip_node
def the_pre_hook(inputs) -> None:
    print(f"Pre-hook: Node is about to execute with inputs {inputs}")


@skip_node
def the_post_hook(inputs, output) -> None:
    print(f"Post-hook: Node executed with inputs {inputs} and output {output}")


@add_node_options(node_name="Add With Hooks", return_value_name="sum")
@pre_execution_hook(the_pre_hook)
@post_execution_hook(the_post_hook)
def add_with_hooks(a: int, b: int) -> int:
    return a + b
