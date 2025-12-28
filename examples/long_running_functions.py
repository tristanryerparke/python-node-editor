import time

from python_node_editor.display import flush_output_to_frontend


def slow_add(a: int, b: int) -> int:
    for remaining in range(5, 0, -1):
        print(f"Adding {a} and {b} in {remaining} seconds")
        time.sleep(1)
    result = a + b
    print(f"{a} + {b} = {result}")
    return result


def slow_add_with_update(a: int, b: int) -> int:
    time.sleep(1)
    for remaining in range(5, 0, -1):
        flush_output_to_frontend(f"Adding {a} and {b} in {remaining} seconds")
        time.sleep(1)
    result = a + b
    flush_output_to_frontend(f"{a} + {b} = {result}")
    return result


# s
