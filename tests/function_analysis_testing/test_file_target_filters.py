import pytest

from python_node_editor.analysis.utils import (
    FunctionNotFoundError,
    analyze_file_structure,
)


def test_analyze_single_function_from_file_selector():
    function_schemas, callables, types = analyze_file_structure(
        "examples/integer_math.py:add"
    )

    assert len(function_schemas) == 1
    assert function_schemas[0].name == "add"
    assert len(callables) == 1
    assert set(types.keys()) == {"int"}


def test_analyze_file_selector_raises_when_function_missing():
    with pytest.raises(FunctionNotFoundError) as exc_info:
        analyze_file_structure("examples/integer_math.py:not_a_real_function")

    assert "not_a_real_function" in str(exc_info.value)
    assert "examples/integer_math.py" in str(exc_info.value)


def _write_temp_functions_file(tmp_path):
    test_file = tmp_path / "underscore_filter_sample.py"
    test_file.write_text(
        """\
def visible(a: int, b: int) -> int:
    return a + b

def _hidden(a: int, b: int) -> int:
    return a - b
"""
    )
    return str(test_file)


def test_underscore_prefixed_functions_are_ignored_by_default(tmp_path):
    test_file = _write_temp_functions_file(tmp_path)
    function_schemas, callables, _ = analyze_file_structure(test_file)

    schema_names = {schema.name for schema in function_schemas}
    assert schema_names == {"visible"}
    assert len(callables) == 1


def test_underscore_prefixed_functions_can_be_included(tmp_path):
    test_file = _write_temp_functions_file(tmp_path)
    function_schemas, callables, _ = analyze_file_structure(
        test_file, ignore_underscore_prefix=False
    )

    schema_names = {schema.name for schema in function_schemas}
    assert "visible" in schema_names
    assert "_hidden" in schema_names
    assert len(callables) == 2
