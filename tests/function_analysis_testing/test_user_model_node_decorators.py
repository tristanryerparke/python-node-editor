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
