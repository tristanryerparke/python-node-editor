from python_node_editor.display import construct_deconstruct
from python_node_editor.schema_base import UserModel


@construct_deconstruct
class Point2D(UserModel):
    x: float
    y: float


def two_point_distance(a: Point2D, b: Point2D) -> float:
    """Calculates the distance between two 2D points."""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


def passthrough_point(point: Point2D) -> Point2D:
    return point
