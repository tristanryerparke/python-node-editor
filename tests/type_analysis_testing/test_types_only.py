from devtools import debug as d

from python_node_editor.analysis.types_analysis import analyze_type, get_type_repr
from python_node_editor.schema_base import StructDescr, UnionDescr
from tests.assets.types_only import (
    basic_single_types,
    basic_union_types,
    differing_union_types,
    dummy_function_for_accessing_globals,
    simple_generic,
    unions_in_list,
    user_model_aliases,
)

file_path = "tests/assets/types_only.py"

module_ns = dummy_function_for_accessing_globals.__globals__


def test_basic_types():
    """Test that basic builtin types are represented correctly."""

    for typename, type_obj in basic_single_types.items():
        print(f"{typename}: {type_obj}")
        repr_result = get_type_repr(type_obj, module_ns)
        d(repr_result)

        # Basic types should be represented as their string name
        assert repr_result == typename


def test_differing_union_types():
    """Test that union types (both typing.Union and | syntax) produce the any_of structure."""

    for typename, type_obj in differing_union_types.items():
        print(f"{typename}: {type_obj}")
        repr_result = get_type_repr(type_obj, module_ns)
        d(repr_result)

        # Both union syntaxes should produce the same any_of structure
        assert repr_result == UnionDescr(any_of=["int", "float"])


def test_basic_union_types():
    """Test that basic union types are represented correctly."""

    # Simple int | str union type
    typename = "int | str"
    repr_result = get_type_repr(basic_union_types[typename], module_ns)
    d(repr_result)
    assert repr_result == UnionDescr(any_of=["int", "str"])

    # Simple int | float union type
    typename = "int | float"
    repr_result = get_type_repr(basic_union_types[typename], module_ns)
    d(repr_result)
    assert repr_result == UnionDescr(any_of=["int", "float"])

    # Simple int | bool | str union type
    typename = "int | bool | str"
    repr_result = get_type_repr(basic_union_types[typename], module_ns)
    d(repr_result)
    assert repr_result == UnionDescr(any_of=["int", "bool", "str"])


def test_unions_in_list():
    """Test that union types in a list are represented correctly."""

    # List of int | float union type
    typename = "list[int | float]"
    repr_result = get_type_repr(unions_in_list[typename], module_ns)
    d(repr_result)
    assert repr_result == StructDescr(
        structure_type="list",
        items_type=UnionDescr(any_of=["int", "float"]),
    )

    # List of int | bool | str union type
    typename = "list[int | bool | str]"
    repr_result = get_type_repr(unions_in_list[typename], module_ns)
    d(repr_result)
    assert repr_result == StructDescr(
        structure_type="list",
        items_type=UnionDescr(any_of=["int", "bool", "str"]),
    )


def test_user_model():
    """Test that user-defined models are analyzed correctly."""

    # Get the Command user model
    typename = "Command"
    type_obj = user_model_aliases[typename]

    # Validate the repr
    repr_result = get_type_repr(type_obj, module_ns)
    d(repr_result)
    assert repr_result == "Command"

    # Validate the types were properly parsed
    types_dict = analyze_type(type_obj, file_path, module_ns, {})
    d(types_dict)

    # Check that Command is recognized as a user model
    assert "Command" in types_dict
    assert types_dict["Command"].kind == "user_model"
    assert types_dict["Command"].category == ["tests", "assets", "types_only"]
    assert types_dict["Command"].properties == {
        "body": "str",
        "comment": "str",
        "xcoord": "float",
        "ycoord": "float",
        "zcoord": "float",
        "feedrate": "int",
    }
    assert types_dict["Command"]._class is not None

    # Check that the property types are also in the types_dict
    assert "str" in types_dict
    assert types_dict["str"].kind == "builtin"
    assert types_dict["str"]._class is str
    assert "float" in types_dict
    assert types_dict["float"].kind == "builtin"
    assert types_dict["float"]._class is float
    assert "int" in types_dict
    assert types_dict["int"].kind == "builtin"
    assert types_dict["int"]._class is int


def test_simple_generic():
    """Test that a simple generic type like list[int] triggers the final if block."""

    typename = "list[int]"
    type_obj = simple_generic[typename]

    print(f"\n{'=' * 60}")
    print(f"Testing: {typename}")
    print(f"Type object: {type_obj}")
    print(f"{'=' * 60}\n")

    # Analyze the type
    types_dict = analyze_type(type_obj, file_path, module_ns, {})
    d(types_dict)


if __name__ == "__main__":
    test_basic_types()
    test_differing_union_types()
    test_basic_union_types()
    test_unions_in_list()
    test_user_model()
    test_simple_generic()
