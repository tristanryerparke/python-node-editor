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
