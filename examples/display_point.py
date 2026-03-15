import json
import urllib.request

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


def display_point(point, object_id=None, style=None, node_id=None):
    try:
        import rhino3dm
    except Exception:
        return False

    resolved_object_id = object_id or node_id or "point_stuff_rhino.result"

    payload = {
        "object_id": resolved_object_id,
        "geometry_type": "point",
        "geometry": rhino3dm.Point3d(
            float(point.x),
            float(point.y),
            float(getattr(point, "z", 0.0)),
        ).Encode(),
    }
    if style is not None:
        payload["style"] = style

    try:
        post_json("/geometry", payload)
    except Exception:
        return False

    return True
