"""
Test functions with delays for testing async execution behavior.
Each function has short delays (<500ms) to simulate processing time
and allow testing different stages of node updates.
"""

import time

from python_node_editor.display import flush_output_to_frontend


def quick_add(a: int, b: int) -> int:
    """Add two numbers with a short delay."""
    print("Starting addition...")
    time.sleep(0.3)
    result = a + b
    print(f"{a} + {b} = {result}")
    return result


def quick_multiply(x: int, y: int) -> int:
    """Multiply two numbers with a short delay."""
    print("Starting multiplication...")
    time.sleep(0.3)
    result = x * y
    print(f"{x} * {y} = {result}")
    return result


def quick_divide(numerator: int, denominator: int) -> float:
    """Divide two numbers with a short delay. Raises error if denominator is 0."""
    print("Starting division...")
    time.sleep(0.2)
    if denominator == 0:
        raise ValueError("Cannot divide by zero!")
    result = numerator / denominator
    print(f"{numerator} / {denominator} = {result}")
    return result


def quick_power(base: int, exponent: int) -> int:
    """Raise base to exponent with a short delay."""
    print(f"Calculating {base}^{exponent}...")
    time.sleep(0.25)
    result = base**exponent
    print(f"{base}^{exponent} = {result}")
    return result


def slow_add_with_update(a: int, b: int) -> int:
    """Add two numbers with incremental progress updates.

    This function demonstrates flush_output_to_frontend by sending progress updates
    while waiting, allowing the frontend to see the accumulated terminal output.
    """
    for remaining in range(3, 0, -1):
        flush_output_to_frontend(f"Adding {a} and {b} in {remaining} seconds")
        time.sleep(0.2)
    result = a + b
    flush_output_to_frontend(f"{a} + {b} = {result}")
    return result
