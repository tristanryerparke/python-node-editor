from python_node_editor.analysis.utils import analyze_file_structure
from python_node_editor.schema import DataWrapper


def test_model_only_file_generates_auto_nodes():
    function_schemas, callables, types = analyze_file_structure(
        "tests/assets/user_models_only.py"
    )

    assert len(function_schemas) == 4
    assert len(callables) == 4

    schema_names = {schema.name for schema in function_schemas}
    assert schema_names == {
        "construct-Point3D",
        "deconstruct-Point3D",
        "construct-ThreePointCurve",
        "deconstruct-ThreePointCurve",
    }

    assert set(types.keys()) == {"float", "Point3D", "ThreePointCurve"}

    point_type = types["Point3D"]
    assert point_type.kind == "user_model"
    assert point_type.properties == {"x": "float", "y": "float", "z": "float"}

    curve_type = types["ThreePointCurve"]
    assert curve_type.kind == "user_model"
    assert curve_type.properties == {
        "control_a": "Point3D",
        "control_b": "Point3D",
        "control_c": "Point3D",
    }

    construct_curve_schema = next(
        schema for schema in function_schemas if schema.name == "construct-ThreePointCurve"
    )
    assert construct_curve_schema.arguments == {
        "control_a": DataWrapper(type="Point3D"),
        "control_b": DataWrapper(type="Point3D"),
        "control_c": DataWrapper(type="Point3D"),
    }
    assert construct_curve_schema.outputs == {"return": DataWrapper(type="ThreePointCurve")}

    deconstruct_curve_schema = next(
        schema
        for schema in function_schemas
        if schema.name == "deconstruct-ThreePointCurve"
    )
    assert deconstruct_curve_schema.arguments == {
        "instance": DataWrapper(type="ThreePointCurve")
    }
    assert deconstruct_curve_schema.output_style == "multiple"
    assert deconstruct_curve_schema.outputs == {
        "control_a": DataWrapper(type="Point3D"),
        "control_b": DataWrapper(type="Point3D"),
        "control_c": DataWrapper(type="Point3D"),
    }
