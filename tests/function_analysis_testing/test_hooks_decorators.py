from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.schema import DataWrapper
from tests.assets.hooks import add_with_hooked_options, multiply_with_hooked_options


def test_add_node_options_and_hooks_are_compatible_outer_options_decorator():
    _, schema, func_obj, found_types = analyze_function(add_with_hooked_options)

    assert schema.name == "Hooked Add"
    assert schema.arguments == {
        "a": DataWrapper(type="int"),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"sum": DataWrapper(type="int")}

    assert len(getattr(func_obj, "_pre_execution_hooks", [])) == 1
    assert len(getattr(func_obj, "_post_execution_hooks", [])) == 1

    assert set(found_types.keys()) == {"int"}
    assert found_types["int"].kind == "builtin"
    assert found_types["int"]._class is int


def test_add_node_options_and_hooks_are_compatible_inner_options_decorator():
    _, schema, func_obj, found_types = analyze_function(multiply_with_hooked_options)

    assert schema.name == "Hooked Multiply"
    assert schema.arguments == {
        "a": DataWrapper(type="int"),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"product": DataWrapper(type="int")}

    assert len(getattr(func_obj, "_pre_execution_hooks", [])) == 1
    assert len(getattr(func_obj, "_post_execution_hooks", [])) == 1

    assert set(found_types.keys()) == {"int"}
    assert found_types["int"].kind == "builtin"
    assert found_types["int"]._class is int
