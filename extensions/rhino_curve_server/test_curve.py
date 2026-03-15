#! python3
# r: rhino3dm
import json
import time
import urllib.request

import rhino3dm

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5125


def post_json(path, payload):
    request = urllib.request.Request(
        url=f"http://{SERVER_HOST}:{SERVER_PORT}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def send_geometry(object_id, geometry, geometry_type, style=None):
    payload = {
        "object_id": object_id,
        "geometry_type": geometry_type,
        "geometry": geometry.Encode(),
    }
    if style is not None:
        payload["style"] = style
    response = post_json("/geometry", payload)
    print(response)
    return response


def point3d(coords):
    if isinstance(coords, rhino3dm.Point3d):
        return coords
    return rhino3dm.Point3d(*coords)


def send_point(point_id, point, style=None):
    return send_geometry(point_id, point3d(point), "point", style)


def send_curve(curve_id, curve, style=None):
    return send_geometry(curve_id, curve, "curve", style)


def send_polyline_curve(curve_id, curve, style=None):
    return send_geometry(curve_id, curve, "polyline_curve", style)


def send_brep(brep_id, brep, style=None):
    return send_geometry(brep_id, brep, "brep", style)


def nurbs_curve(points, degree=3):
    return rhino3dm.NurbsCurve.Create(
        False,
        degree,
        [point3d(coords) for coords in points],
    )


def polyline_curve(points):
    return rhino3dm.PolylineCurve([point3d(coords) for coords in points])


def box_brep(min_point, max_point):
    brep = rhino3dm.BoundingBox(
        point3d(min_point),
        point3d(max_point),
    ).ToBrep()
    if brep is None:
        raise RuntimeError("Failed to create Brep preview geometry")
    return brep


def main():
    point_a0 = rhino3dm.Point3d(0, 0, 0)
    point_a1 = rhino3dm.Point3d(10, 12, 0)
    point_a2 = rhino3dm.Point3d(20, -6, 0)
    point_a3 = rhino3dm.Point3d(30, 8, 0)

    send_point("point_a", point_a0, style={"rgb": [255, 96, 96]})
    time.sleep(0.25)

    send_curve(
        "curve_a",
        nurbs_curve(
            [
                point_a1,
                point_a2,
                point_a3,
                (36, 4, 0),
            ]
        ),
        style={"rgb": [255, 140, 0], "thickness": 5},
    )
    time.sleep(0.25)

    send_point("point_a", (6, 18, 4), style={"rgb": [255, 180, 80]})
    time.sleep(0.25)

    send_curve(
        "curve_a",
        nurbs_curve(
            [
                (0, 0, 0),
                (8, 18, 0),
                (18, -10, 6),
                (30, 12, 0),
            ]
        ),
        style={"rgb": [64, 170, 255], "thickness": 2},
    )
    time.sleep(0.25)

    send_point("point_b", (22, 6, 10), style={"rgb": [110, 255, 140]})
    time.sleep(0.25)

    send_curve(
        "curve_b",
        nurbs_curve(
            [
                (2, 0, 0),
                (10, 16, 10),
                (18, -8, 6),
                (26, 10, 0),
                (34, 4, -4),
            ]
        ),
        style={"rgb": [140, 80, 255], "thickness": 7},
    )
    time.sleep(0.25)

    send_polyline_curve(
        "curve_polyline",
        polyline_curve(
            [
                (0, 0, 0),
                (6, 3, 0),
                (10, 8, 0),
                (14, 6, 2),
                (18, 12, 0),
            ]
        ),
        style={"rgb": [40, 220, 220], "thickness": 4},
    )
    time.sleep(0.25)

    send_brep(
        "brep_box",
        box_brep(
            (4, -8, -2),
            (12, 0, 6),
        ),
        style={"rgb": [70, 180, 255], "opacity": 0.55, "thickness": 3},
    )


if __name__ == "__main__":
    main()
