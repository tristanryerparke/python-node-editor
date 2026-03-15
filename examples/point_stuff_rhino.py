from extensions.rhino_curve_server.display_hooks import show_curve, show_point
from python_node_editor.display import add_model_options
from python_node_editor.schema_base import UserModel


@add_model_options(
    construct_post_hook=show_point
)
class Point3D(UserModel):
    x: float
    y: float
    z: float


@add_model_options(
    construct_post_hook=show_curve
)
class ThreePointCurve(UserModel):
    control_a: Point3D
    control_b: Point3D
    control_c: Point3D
