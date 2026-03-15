#! python3
# async: true
# r: flask
# r: rhino3dm
import json
import os
import sys
import threading

import Rhino
import scriptcontext as sc
from deserialize import SUPPORTED_GEOMETRY_TYPES
from werkzeug.serving import make_server

CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from conduit import GeometryPreviewConduit
import server as curve_server

preview_conduit = None


def decode_common_object_payload(geometry_payload):
    from_json = getattr(Rhino.Runtime.CommonObject, "FromJSON", None)
    geometry = None

    if callable(from_json):
        try:
            geometry = from_json(json.dumps(geometry_payload))
        except Exception:
            geometry = None

    if geometry is None:
        from_base64 = getattr(Rhino.Runtime.CommonObject, "FromBase64String", None)
        if callable(from_base64):
            try:
                geometry = from_base64(
                    int(geometry_payload["archive3dm"]),
                    int(geometry_payload["opennurbs"]),
                    str(geometry_payload["data"]),
                )
            except Exception:
                geometry = None

    if geometry is None:
        raise RuntimeError("Failed to decode common-object payload into RhinoCommon geometry")

    return geometry


def decode_point_payload(geometry_payload):
    try:
        point = Rhino.Geometry.Point3d(
            float(geometry_payload["X"]),
            float(geometry_payload["Y"]),
            float(geometry_payload["Z"]),
        )
    except (KeyError, TypeError, ValueError):
        raise RuntimeError("Point payload must contain numeric X, Y, and Z values")

    if not point.IsValid:
        raise RuntimeError("Decoded Rhino point is invalid")

    return point


def decode_geometry_payload(geometry_type, geometry_payload):
    if geometry_type == "point":
        return decode_point_payload(geometry_payload)

    if geometry_type not in {"curve", "polyline_curve", "brep"}:
        raise RuntimeError(f"Unsupported geometry_type: {geometry_type}")

    geometry = decode_common_object_payload(geometry_payload)
    expected_type = {
        "curve": Rhino.Geometry.Curve,
        "polyline_curve": Rhino.Geometry.PolylineCurve,
        "brep": Rhino.Geometry.Brep,
    }[geometry_type]

    if not isinstance(geometry, expected_type):
        raise RuntimeError(
            f"Decoded payload is not a Rhino.Geometry.{expected_type.__name__}"
        )
    if not geometry.IsValid:
        raise RuntimeError(f"Decoded Rhino {geometry_type} is invalid")
    return geometry


def get_preview_conduit():
    global preview_conduit

    if preview_conduit is None:
        preview_conduit = GeometryPreviewConduit()
    return preview_conduit


def redraw_views():
    doc = Rhino.RhinoDoc.ActiveDoc
    if doc is not None:
        doc.Views.Redraw()


def on_idle(sender, event):
    updates = curve_server.drain_geometry_updates()
    if not updates:
        return

    conduit = get_preview_conduit()
    applied_updates = 0

    for object_id, update in updates.items():
        geometry_type = update["geometry_type"]
        geometry_payload = update["geometry_payload"]
        try:
            geometry = decode_geometry_payload(geometry_type, geometry_payload)
        except Exception as exc:
            print(
                {
                    "status": "error",
                    "object_id": object_id,
                    "geometry_type": geometry_type,
                    "error": str(exc),
                }
            )
            continue

        conduit.set_geometry(object_id, geometry_type, geometry)
        applied_updates += 1
        print(
            {
                "status": "updated",
                "object_id": object_id,
                "geometry_type": geometry_type,
            }
        )

    if applied_updates == 0:
        return

    conduit.Enabled = conduit.has_geometry()
    redraw_views()


def main():
    global preview_conduit

    idle_handler_registered = False

    curve_server.reset_runtime_state()
    sc.sticky[curve_server.STICKY_STATE_KEY] = curve_server.request_stop

    try:
        Rhino.RhinoApp.Idle += on_idle
        idle_handler_registered = True

        http_server = make_server(
            curve_server.SERVER_HOST,
            curve_server.SERVER_PORT,
            curve_server.app,
        )
        http_server_thread = threading.Thread(
            target=http_server.serve_forever,
            name="rhino-curve-server",
        )
        curve_server.register_http_server(http_server, http_server_thread)
        http_server_thread.start()

        print(
            f"Starting curve server on {curve_server.SERVER_HOST}:{curve_server.SERVER_PORT}"
        )

        while not curve_server.stop_event.wait(0.1):
            pass
    finally:
        print("Stopping curve server...")

        conduit = preview_conduit
        preview_conduit = None
        if conduit is not None:
            conduit.clear_geometries()
            conduit.Enabled = False

        if idle_handler_registered:
            Rhino.RhinoApp.Idle -= on_idle

        curve_server.request_stop()

        server_thread = curve_server.http_server_thread
        if server_thread is not None:
            server_thread.join(timeout=2)

        sc.sticky.pop(curve_server.STICKY_STATE_KEY, None)
        redraw_views()
        print("Curve server stopped")


if __name__ == "__main__":
    main()
