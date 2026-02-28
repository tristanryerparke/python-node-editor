from devtools import debug as d

from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.schema import DataWrapper
from tests.assets.functions import add, nth_root, percentage


def test_on_simple_add():
    """Test the analysis of the simple addition function from examples.integer_math and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert add(1, 2) == 3

    _, schema, _, found_types = analyze_function(add)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "add"
    assert schema.category == ["tests", "assets", "functions"]
    assert schema.definition_path.endswith(":1")
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


def test_find_float_and_int():
    """Test the analysis of the percentage function from examples.basic_percentage and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert percentage(100.0, 50) == 50.0

    _, schema, _, found_types = analyze_function(percentage)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "percentage"
    assert schema.category == ["tests", "assets", "functions"]
    assert schema.definition_path.endswith(":21")
    assert schema.arguments == {
        "x": DataWrapper(type="float"),
        "percentage": DataWrapper(type="int"),
    }
    assert schema.outputs == {"return": DataWrapper(type="float")}

    # Make sure we found both float and int types
    d(found_types)
    assert set(found_types.keys()) == {"float", "int"}
    assert found_types["float"].kind == "builtin"
    assert found_types["int"].kind == "builtin"
    assert found_types["float"]._class is float
    assert found_types["int"]._class is int


def test_default_value():
    """Test the analysis of the nth_root function from examples.basic_defaultvalue and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert nth_root(8, 3) == 2.0

    _, schema, _, found_types = analyze_function(nth_root)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "nth_root"
    assert schema.category == ["tests", "assets", "functions"]
    assert schema.definition_path.endswith(":25")
    assert schema.arguments == {
        "x": DataWrapper(type="float"),
        "root": DataWrapper(type="int", value=2),
    }
    assert schema.outputs == {"return": DataWrapper(type="float")}

    # Make sure we found both float and int types
    d(found_types)
    assert set(found_types.keys()) == {"float", "int"}
    assert found_types["float"].kind == "builtin"
    assert found_types["int"].kind == "builtin"
    assert found_types["float"]._class is float
    assert found_types["int"]._class is int


if __name__ == "__main__":
    test_on_simple_add()
    test_find_float_and_int()
    test_default_value()
