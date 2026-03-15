from python_node_editor.schema_base import UserModel


class Point3D(UserModel):
    x: float
    y: float
    z: float


class ThreePointCurve(UserModel):
    control_a: Point3D
    control_b: Point3D
    control_c: Point3D
