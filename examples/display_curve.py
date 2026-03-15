from examples.display_point import post_json


def display_three_point_curve(
    curve,
    object_id=None,
    style=None,
    node_id=None,
):
    try:
        import rhino3dm
    except Exception:
        return False

    resolved_object_id = object_id or node_id or "point_stuff_rhino.curve"

    points = [
        rhino3dm.Point3d(
            float(point.x),
            float(point.y),
            float(getattr(point, "z", 0.0)),
        )
        for point in (curve.control_a, curve.control_b, curve.control_c)
    ]
    geometry = rhino3dm.NurbsCurve.Create(False, 2, points)
    if geometry is None:
        return False

    payload = {
        "object_id": resolved_object_id,
        "geometry_type": "curve",
        "geometry": geometry.Encode(),
    }
    if style is not None:
        payload["style"] = style

    try:
        post_json("/geometry", payload)
    except Exception:
        return False

    return True
