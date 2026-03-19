from devtools import debug as d

from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.schema import DataWrapper, UnionDescr
from tests.assets.functions import add_with_union


def test_union():
    """Test the analysis of the simple addition function from examples.integer_math and confirm the schema and found types are correct."""

    # Make sure the function works as expected
    assert add_with_union(1, 2) == 3

    _, schema, _, found_types = analyze_function(add_with_union)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "add_with_union"
    assert schema.arguments == {
        "a": DataWrapper(type=UnionDescr(any_of=["int", "float"])),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"return": DataWrapper(type="float")}

    # Make sure we found both int and float types
    d(found_types)
    assert set(found_types.keys()) == {"int", "float"}
    assert found_types["int"].kind == "builtin"
    assert found_types["float"].kind == "builtin"
    assert found_types["int"]._class is int
    assert found_types["float"]._class is float


if __name__ == "__main__":
    test_union()
