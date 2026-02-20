import pytest

from python_node_editor.analysis.functions_analysis import ParameterNotTypeAnnotated, analyze_function
print(__file__)

def test_unannotated_regular_parameter():
    """Test that ParameterNotTypeAnnotated is raised when a regular parameter lacks type annotation."""

    def unannotated_function(x, y):
        return x + y

    with pytest.raises(
        ParameterNotTypeAnnotated, match="Parameter x has no annotation"
    ):
        analyze_function(unannotated_function)


def test_unannotated_args_parameter():
    """Test that ParameterNotTypeAnnotated is raised when *args parameter lacks type annotation."""

    def unannotated_args_function(*args):
        return sum(args)

    with pytest.raises(
        ParameterNotTypeAnnotated, match=r"Parameter \*args has no annotation"
    ):
        analyze_function(unannotated_args_function)


def test_partially_annotated_function():
    """Test that ParameterNotTypeAnnotated is raised when only some parameters are annotated."""

    def partially_annotated(x: int, y):
        return x + y

    with pytest.raises(
        ParameterNotTypeAnnotated, match="Parameter y has no annotation"
    ):
        analyze_function(partially_annotated)


def test_unannotated_return_type():
    """Test that an exception is raised when return type is not annotated."""

    def no_return_annotation(x: int, y: int):
        return x + y

    with pytest.raises(Exception, match="has no return annotation"):
        analyze_function(no_return_annotation)


if __name__ == "__main__":
    test_unannotated_regular_parameter()
    test_unannotated_args_parameter()
    test_partially_annotated_function()
    test_unannotated_return_type()
    print("All tests passed!")
