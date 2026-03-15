#! python3
# async: true
# r: flask
# r: rhino3dm
import base64
import importlib
import json
import os
import sys
import threading

import Rhino
import scriptcontext as sc
from werkzeug.serving import make_server

CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)


def load_local_module(module_name):
    module = sys.modules.get(module_name)
    if module is not None:
        return importlib.reload(module)
    return importlib.import_module(module_name)


deserialize = load_local_module("deserialize")
conduit = load_local_module("conduit")
curve_server = load_local_module("server")

SUPPORTED_GEOMETRY_TYPES = deserialize.SUPPORTED_GEOMETRY_TYPES
GeometryPreviewConduit = conduit.GeometryPreviewConduit

preview_conduit = None
pick_request_in_progress = False


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


def encode_common_object_payload(geometry):
    serialization_options = Rhino.FileIO.SerializationOptions()
    return json.loads(geometry.ToJSON(serialization_options))


def encode_brep_file3dm(brep):
    file3dm = Rhino.FileIO.File3dm()
    file3dm.Objects.AddBrep(brep)
    return base64.b64encode(file3dm.ToByteArray()).decode("ascii")


def serialize_brep_response(object_id, brep):
    response = {
        "status": "selected",
        "object_id": object_id,
        "geometry_type": "brep",
        "file3dm": None,
        "geometry": None,
    }
    serialization_errors = []

    try:
        response["geometry"] = encode_common_object_payload(brep)
    except Exception as exc:
        serialization_errors.append(f"geometry encode failed: {exc}")

    try:
        response["file3dm"] = encode_brep_file3dm(brep)
    except Exception as exc:
        serialization_errors.append(f"file3dm encode failed: {exc}")

    if response["geometry"] is None and response["file3dm"] is None:
        raise RuntimeError("; ".join(serialization_errors))

    return response


def prompt_for_brep(prompt):
    get_object = Rhino.Input.Custom.GetObject()
    get_object.SetCommandPrompt(prompt)
    get_object.GeometryFilter = (
        Rhino.DocObjects.ObjectType.Surface | Rhino.DocObjects.ObjectType.PolysrfFilter
    )
    get_object.SubObjectSelect = False

    try:
        result = get_object.Get()
        if result != Rhino.Input.GetResult.Object:
            return {
                "status": "cancelled",
                "message": "Brep selection cancelled",
            }

        object_reference = get_object.Object(0)
        if object_reference is None:
            return {
                "status": "error",
                "error": "Rhino did not return a selected object reference",
            }

        brep = object_reference.Brep()
        if brep is None:
            geometry = object_reference.Geometry()
            if geometry is not None:
                brep = Rhino.Geometry.Brep.TryConvertBrep(geometry)

        if brep is None:
            return {
                "status": "error",
                "error": "Selected object could not be converted to a Brep",
            }
        if not brep.IsValid:
            return {
                "status": "error",
                "error": "Selected Brep is invalid",
            }

        return serialize_brep_response(str(object_reference.ObjectId), brep)
    finally:
        get_object.Dispose()


def service_brep_pick_request():
    global pick_request_in_progress

    if pick_request_in_progress:
        return

    pending_request = curve_server.next_brep_pick_request()
    if pending_request is None or pending_request.cancelled:
        return

    pick_request_in_progress = True
    try:
        if curve_server.stop_event.is_set():
            pending_request.finish(
                {"status": "error", "error": "Server is shutting down"},
                503,
            )
            return

        response = prompt_for_brep(pending_request.prompt)
        http_status = 200
        if response["status"] == "error":
            http_status = 500
        pending_request.finish(response, http_status)
    except Exception as exc:
        pending_request.finish(
            {
                "status": "error",
                "error": f"Unhandled Rhino Brep selection error: {exc}",
            },
            500,
        )
    finally:
        pick_request_in_progress = False


def redraw_views():
    doc = Rhino.RhinoDoc.ActiveDoc
    if doc is not None:
        doc.Views.Redraw()


def on_idle(sender, event):
    service_brep_pick_request()

    geometry_updates = curve_server.drain_geometry_updates()
    visibility_updates = curve_server.drain_visibility_updates()
    if not geometry_updates and not visibility_updates:
        return

    conduit = get_preview_conduit()
    geometry_applied_updates = 0
    visibility_applied_updates = 0

    for object_id, update in geometry_updates.items():
        geometry_type = update["geometry_type"]
        geometry_payload = update["geometry_payload"]
        style = update.get("style")
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

        conduit.set_geometry(object_id, geometry_type, geometry, style)
        geometry_applied_updates += 1
        print(
            {
                "status": "updated",
                "object_id": object_id,
                "geometry_type": geometry_type,
                "style": style,
            }
        )

    for object_id, update in visibility_updates.items():
        visible = bool(update["visible"])
        was_applied = conduit.set_visibility(object_id, visible)
        print(
            {
                "status": "visibility_updated" if was_applied else "visibility_not_found",
                "object_id": object_id,
                "visible": visible,
            }
        )
        if was_applied:
            visibility_applied_updates += 1

    if geometry_applied_updates == 0 and visibility_applied_updates == 0:
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
