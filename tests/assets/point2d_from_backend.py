from python_node_editor.display import deconstruct, retrieve_input_data
from python_node_editor.schema_base import UserModel


def _retrieve_point2d_data():
    return {"x": 5, "y": 100}


@retrieve_input_data(_retrieve_point2d_data)
@deconstruct
class Point2DFromBackend(UserModel):
    x: float
    y: float


def passthrough_point(point: Point2DFromBackend) -> Point2DFromBackend:
    return point
