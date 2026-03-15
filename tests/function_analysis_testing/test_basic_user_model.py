from devtools import debug as d

from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.schema import DataWrapper
from python_node_editor.schema_base import TypeDefModel, UserTypeDefModel
from tests.assets.user_model import Point2D, two_point_distance
from tests.assets.user_model_not_used_in_function import add


def translate_up(point: Point2D, distance: float) -> Point2D:
    return Point2D(x=point.x, y=point.y + distance)


def test_user_model_detection():
    """Analyzes the two_point_distance function and verifies the correct parsing of
    its arguments, the Point2D user model"""

    # Make sure the function works as expected
    p1 = Point2D(x=0.0, y=0.0)
    p2 = Point2D(x=3.0, y=4.0)
    assert two_point_distance(p1, p2) == 5.0

    _, schema, _, found_types = analyze_function(two_point_distance)
    d(schema)

    # check that the key parts of the schema are being correctly parsed
    assert schema.name == "two_point_distance"
    assert schema.category == ["tests", "assets", "user_model"]
    assert schema.arguments == {
        "a": DataWrapper(type="Point2D"),
        "b": DataWrapper(type="Point2D"),
    }
    assert schema.outputs == {"return": DataWrapper(type="float")}

    # Make sure we found the Point2D UserModel and float type
    d(found_types)
    assert "float" in found_types
    assert found_types["float"].kind == "builtin"
    assert found_types["float"]._class is float
    assert "Point2D" in found_types
    assert found_types["Point2D"].kind == "user_model"
    assert found_types["Point2D"]._class is Point2D
    assert found_types["Point2D"].category == ["tests", "assets", "user_model"]
    assert found_types["Point2D"].properties == {"x": "float", "y": "float"}


def test_user_model_return_stays_single_output():
    result = translate_up(Point2D(x=2.0, y=3.0), 5.0)
    assert result == Point2D(x=2.0, y=8.0)

    _, schema, _, found_types = analyze_function(translate_up)
    d(schema)

    assert schema.arguments == {
        "point": DataWrapper(type="Point2D"),
        "distance": DataWrapper(type="float"),
    }
    assert schema.output_style == "single"
    assert schema.outputs == {"return": DataWrapper(type="Point2D")}

    d(found_types)
    assert "Point2D" in found_types
    assert found_types["Point2D"].kind == "user_model"
    assert found_types["Point2D"]._class is Point2D


def test_user_model_not_used_in_function():
    """Tests that the Point2D model is not discovered even though it is defined
    in the same file as a function that is analyzed"""
    _, schema, _, found_types = analyze_function(add)
    d(schema)

    assert schema.name == "add"
    assert schema.category == ["tests", "assets", "user_model_not_used_in_function"]
    assert schema.arguments == {
        "a": DataWrapper(type="int"),
        "b": DataWrapper(type="int"),
    }
    assert schema.outputs == {"return": DataWrapper(type="int")}

    # Make sure we only found the int type and not any of the types associated with the Point2D model
    d(found_types)
    assert "Point2D" not in found_types
    assert "float" not in found_types


if __name__ == "__main__":
    test_user_model_detection()
    test_user_model_return_stays_single_output()
    test_user_model_not_used_in_function()
