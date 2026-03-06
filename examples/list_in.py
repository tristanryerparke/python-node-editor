from python_node_editor.display import add_node_options



def add_list(a: list[int | float], b: list[int]) -> list[int]:
    return [x + y for x, y in zip(a, b)]

@add_node_options(list_inputs=True)
def make_list_ints(*ints: int) -> list[int]:
    return [*ints]