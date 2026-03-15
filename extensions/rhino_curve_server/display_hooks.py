from examples.display_curve import display_three_point_curve
from examples.display_point import display_point


def show_point(point, node_id=None):
    return display_point(
        point,
        object_id=node_id,
        style={"rgb": [0, 128, 255]},
    )


def show_curve(curve, node_id=None):
    return display_three_point_curve(
        curve,
        object_id=node_id,
        style={"rgb": [255, 200, 0], "thickness": 3},
    )
