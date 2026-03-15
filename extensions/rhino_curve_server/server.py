import queue
import threading

from flask import Flask, jsonify, request
from deserialize import validated_geometry_update

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5125
STICKY_STATE_KEY = "python_node_editor.rhino_curve_server.worker_state"

app = Flask(__name__)
geometry_updates = queue.Queue()
stop_event = threading.Event()
http_server = None
http_server_thread = None
http_server_shutdown_started = False
http_server_shutdown_lock = threading.Lock()


def reset_runtime_state():
    global http_server
    global http_server_thread
    global http_server_shutdown_started

    stop_event.clear()
    http_server = None
    http_server_thread = None
    http_server_shutdown_started = False

    while True:
        try:
            geometry_updates.get_nowait()
        except queue.Empty:
            break


def register_http_server(server, server_thread):
    global http_server
    global http_server_thread
    global http_server_shutdown_started

    http_server = server
    http_server_thread = server_thread
    http_server_shutdown_started = False


def request_stop():
    global http_server_shutdown_started

    stop_event.set()

    with http_server_shutdown_lock:
        server = http_server
        if server is None or http_server_shutdown_started:
            return
        http_server_shutdown_started = True

    threading.Thread(
        target=server.shutdown,
        name="rhino-curve-server-shutdown",
        daemon=True,
    ).start()


def drain_geometry_updates():
    latest_by_object_id = {}

    while True:
        try:
            update = geometry_updates.get_nowait()
        except queue.Empty:
            break
        latest_by_object_id[update["object_id"]] = update

    return latest_by_object_id


def drain_curve_updates():
    return drain_geometry_updates()


def _payload_object():
    payload = request.get_json(silent=True)
    if payload is None:
        return {}
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object")
    return payload


def _accept_geometry_request(forced_geometry_type=None):
    if stop_event.is_set():
        return jsonify({"status": "error", "error": "Server is shutting down"}), 503

    try:
        payload = _payload_object()
        if forced_geometry_type is not None:
            payload = dict(payload)
            payload.setdefault("geometry_type", forced_geometry_type)
        update = validated_geometry_update(payload)
    except ValueError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 400

    geometry_updates.put(update)
    return jsonify(
        {
            "status": "accepted",
            "object_id": update["object_id"],
            "geometry_type": update["geometry_type"],
        }
    )


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "pending_updates": geometry_updates.qsize(),
            "stopping": stop_event.is_set(),
        }
    )


@app.post("/geometry")
def geometry():
    return _accept_geometry_request()


@app.post("/curve")
def curve():
    return _accept_geometry_request(forced_geometry_type="curve")


@app.post("/shutdown")
def shutdown():
    try:
        _payload_object()
    except ValueError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 400

    request_stop()
    return jsonify({"status": "accepted", "shutdown": True})
