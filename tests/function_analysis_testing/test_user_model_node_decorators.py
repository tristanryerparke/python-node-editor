from python_node_editor.analysis.utils import analyze_file_structure


def test_construct_deconstruct_nodes_are_opt_in():
    function_schemas, _, _ = analyze_file_structure(
        "tests/assets/user_model_node_decorators.py"
    )
    schema_names = {schema.name for schema in function_schemas}

    assert "passthrough_no_decorator" in schema_names
    assert "passthrough_construct_only" in schema_names
    assert "passthrough_deconstruct_only" in schema_names
    assert "passthrough_construct_deconstruct" in schema_names

    assert "construct-NoDecorator" not in schema_names
    assert "deconstruct-NoDecorator" not in schema_names

    assert "construct-ConstructOnly" in schema_names
    assert "deconstruct-ConstructOnly" not in schema_names

    assert "construct-DeconstructOnly" not in schema_names
    assert "deconstruct-DeconstructOnly" in schema_names

    assert "construct-ConstructDeconstruct" in schema_names
    assert "deconstruct-ConstructDeconstruct" in schema_names


def test_decorated_user_model_nodes_exist_without_functions(tmp_path):
    test_file = tmp_path / "class_only_nodes.py"
    test_file.write_text(
        """\
from python_node_editor.display import construct, construct_deconstruct, deconstruct
from python_node_editor.schema_base import UserModel

@construct
class ConstructOnly(UserModel):
    value: float

@deconstruct
class DeconstructOnly(UserModel):
    value: float

@construct_deconstruct
class ConstructDeconstruct(UserModel):
    value: float
"""
    )

    function_schemas, callables, types = analyze_file_structure(str(test_file))
    schema_names = {schema.name for schema in function_schemas}

    assert schema_names == {
        "construct-ConstructOnly",
        "deconstruct-DeconstructOnly",
        "construct-ConstructDeconstruct",
        "deconstruct-ConstructDeconstruct",
    }
    assert len(callables) == 4
    assert {"ConstructOnly", "DeconstructOnly", "ConstructDeconstruct"} <= set(types)
