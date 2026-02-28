# Intro
PNE is meant to make it easy for you to execute your python code visually, without having to write the code in a special way (other than type annotating it). However there may be times when you want to improve the experience on the frontend, or add functionalities that are too complex for the frontend to automatically analyze. PNE as a library adds some useful ways to augment your python code for use in the frontend.

These examples assume you have [PNE installed](https://github.com/tristanryerparke/python-node-editor/wiki/Installation).

# Basic Customization

Examples for node customization are in this file: [examples/basic_custominfo.py](../examples/basic_custominfo.py) and can be run with `uv run pne examples/custom_info.py`

## Docstrings
Docstring analysis is built into PNE by default. When you add a docstring on your function, it appears when you mouse over the function the node picker.

<img alt="images/localhost_8000_ (3).png" src="images/localhost_8000_ (3).png">

### Node Name
In python, function names are restricted to a naming convention, and we might want a prettier name to display on the frontend. To add a custom name you can use the `add_node_options` decorator:

```python
from python_node_editor.display import add_node_options
@add_node_options(node_name="Add With Custom Name")
def add_with_custom_name(a: int, b: int) -> int:
    return a + b
```

## Return Value Name
In python arguments have names, but return values don't. To add a name to your function's return value that displays on the frontend, you can use the same decorator:

```python
from python_node_editor.display import add_node_options
@add_node_options(return_value_name="area")
def calculate_rectangle_area(width: float, height: float) -> float:
    return width * height
```
<img alt="Screenshot 2025-11-10 at 15 27 03" src="https://github.com/user-attachments/assets/506cc3c9-7d69-4e26-9470-30d2b9da154f" />

# Multiple Outputs

Python functions can't really have multiple outputs, you can return a tuple and unpack it, but that tuple is still a single return value.
In node-based editors, you might want a node to have more than one output. PNE provides an easy way to do this, with type annotations as well. [examples/multiple_outputs.py](../examples/basic_multiple_outputs.py) provides an example which can be run with `uv run pne examples/multiple_outputs.py`. The main concept is as follows:

```python
from app.schema import MultipleOutputs

class IntegerDivisionOutputs(MultipleOutputs):
    quotient: int
    remainder: int

def integer_division_multiple_outputs(
    numerator: int, denominator: int
) -> IntegerDivisionOutputs:
    quotient = numerator // denominator
    remainder = numerator % denominator
    return IntegerDivisionOutputs(quotient=quotient, remainder=remainder)
```

The `MultipleOutputs` class derives from the pydantic `BaseModel` and the use of its subclasses as a return type annotation allows the frontend to display an output for each field. On the frontend, this function will be displayed like this:

<img alt="localhost_8000_ (5).png" src="images/localhost_8000_ (5).png">
