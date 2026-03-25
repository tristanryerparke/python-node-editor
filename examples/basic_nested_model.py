from examples.user_model import Point2D
from python_node_editor.display import add_node_options, construct_deconstruct
from python_node_editor.schema_base import UserModel


@construct_deconstruct
class Polygon(UserModel):
    vertices: list[Point2D]


def move_polygon(polygon: Polygon, dx: float, dy: float) -> Polygon:
    """Move a polygon by a given amount in the x and y directions."""
    return Polygon(
        vertices=[
            Point2D(x=vertex.x + dx, y=vertex.y + dy) for vertex in polygon.vertices
        ]
    )


@add_node_options(list_inputs=True, return_value_name="list_of_points")
def create_list_of_points(*args: Point2D) -> list[Point2D]:
    """This turns into a node on the frontend where you can add multiple inputs to create a list"""
    return [*args]
