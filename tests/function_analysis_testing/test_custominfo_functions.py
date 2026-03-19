from devtools import debug as d

from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.schema import DataWrapper
from tests.assets.custominfo import (
    add_with_custom_name,
    add_with_docstring,
    calculate_rectangle_area,
)


def test_add_with_docstring():
    """Test that docstrings are correctly captured in the schema."""

    # Make sure the function works as expected
    assert add_with_docstring(3, 4) == 7

    _, schema, _, found_types = analyze_function(add_with_docstring)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "add_with_docstring"
    if schema.doc:
        assert schema.doc.startswith("Adds two numbers together.")
    else:
        assert False, "Docstring not found"
    assert schema.arguments == {
        "a": DataWrapper(type="int"),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"return": DataWrapper(type="int")}

    # Make sure we only found the int type
    d(found_types)
    assert set(found_types.keys()) == {"int"}
    assert found_types["int"].kind == "builtin"
    assert found_types["int"]._class is int


def test_add_with_custom_name():
    """Test that the @add_node_options decorator correctly sets a custom node name."""

    # Make sure the function works as expected
    assert add_with_custom_name(5, 6) == 11

    _, schema, _, found_types = analyze_function(add_with_custom_name)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "Add With Custom Name"
    assert schema.arguments == {
        "a": DataWrapper(type="int"),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"return": DataWrapper(type="int")}

    # Make sure we only found the int type
    d(found_types)
    assert set(found_types.keys()) == {"int"}
    assert found_types["int"].kind == "builtin"
    assert found_types["int"]._class is int


def test_custom_return_name():
    """Test that the @add_node_options decorator correctly sets a custom return value name."""

    # Make sure the function works as expected
    assert calculate_rectangle_area(10.0, 5.0) == 50.0

    _, schema, _, found_types = analyze_function(calculate_rectangle_area)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "calculate_rectangle_area"
    assert schema.arguments == {
        "width": DataWrapper(type="float"),
        "height": DataWrapper(type="float"),
    }
    assert schema.outputs == {"area": DataWrapper(type="float")}

    # Make sure we only found the float type
    d(found_types)
    assert set(found_types.keys()) == {"float"}
    assert found_types["float"].kind == "builtin"
    assert found_types["float"]._class is float


if __name__ == "__main__":
    test_add_with_docstring()
    test_add_with_custom_name()
    test_custom_return_name()
