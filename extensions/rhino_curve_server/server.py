import queue
import threading
import time

from flask import Flask, jsonify, request
from deserialize import object_id_from_payload, validated_geometry_update

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5125
STICKY_STATE_KEY = "python_node_editor.rhino_curve_server.worker_state"

app = Flask(__name__)
geometry_updates = queue.Queue()
visibility_updates = queue.Queue()
brep_pick_requests = queue.Queue()
stop_event = threading.Event()
http_server = None
http_server_thread = None
http_server_shutdown_started = False
http_server_shutdown_lock = threading.Lock()


class PendingBrepPickRequest:
    def __init__(self, prompt):
        self.prompt = prompt
        self.completed = threading.Event()
        self.response = {"status": "error", "error": "Brep pick did not complete"}
        self.http_status = 500
        self.cancelled = False
        self._lock = threading.Lock()

    def finish(self, response, http_status=200):
        with self._lock:
            if self.completed.is_set() or self.cancelled:
                return False
            self.response = response
            self.http_status = http_status
            self.completed.set()
            return True

    def cancel(self, response, http_status):
        with self._lock:
            if self.completed.is_set():
                return False
            self.cancelled = True
            self.response = response
            self.http_status = http_status
            self.completed.set()
            return True


def _drain_queue(target_queue, on_item=None):
    while True:
        try:
            item = target_queue.get_nowait()
        except queue.Empty:
            break
        if on_item is not None:
            on_item(item)


def reset_runtime_state():
    global http_server
    global http_server_thread
    global http_server_shutdown_started

    stop_event.clear()
    http_server = None
    http_server_thread = None
    http_server_shutdown_started = False

    _drain_queue(geometry_updates)
    _drain_queue(visibility_updates)
    _drain_queue(
        brep_pick_requests,
        lambda pending: pending.cancel(
            {"status": "error", "error": "Server state was reset"},
            503,
        ),
    )


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
    _drain_queue(
        brep_pick_requests,
        lambda pending: pending.cancel(
            {"status": "error", "error": "Server is shutting down"},
            503,
        ),
    )

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


def drain_visibility_updates():
    latest_by_object_id = {}

    while True:
        try:
            update = visibility_updates.get_nowait()
        except queue.Empty:
            break
        latest_by_object_id[update["object_id"]] = update

    return latest_by_object_id


def queue_brep_pick_request(prompt):
    pending = PendingBrepPickRequest(prompt)
    brep_pick_requests.put(pending)
    return pending


def next_brep_pick_request():
    while True:
        try:
            pending = brep_pick_requests.get_nowait()
        except queue.Empty:
            return None
        if pending.cancelled:
            continue
        return pending


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


def _accept_visibility_request(visible):
    if stop_event.is_set():
        return jsonify({"status": "error", "error": "Server is shutting down"}), 503

    try:
        payload = _payload_object()
        object_id = object_id_from_payload(payload)
    except ValueError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 400

    visibility_updates.put(
        {
            "object_id": object_id,
            "visible": bool(visible),
        }
    )
    return jsonify(
        {
            "status": "accepted",
            "object_id": object_id,
            "visible": bool(visible),
        }
    )


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "pending_updates": geometry_updates.qsize(),
            "pending_visibility_updates": visibility_updates.qsize(),
            "stopping": stop_event.is_set(),
        }
    )


@app.post("/geometry")
def geometry():
    return _accept_geometry_request()


@app.post("/curve")
def curve():
    return _accept_geometry_request(forced_geometry_type="curve")


@app.post("/hide")
def hide():
    return _accept_visibility_request(False)


@app.post("/show")
def show():
    return _accept_visibility_request(True)


@app.post("/pick_brep")
def pick_brep():
    if stop_event.is_set():
        return jsonify({"status": "error", "error": "Server is shutting down"}), 503

    try:
        payload = _payload_object()
    except ValueError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 400

    prompt = payload.get("prompt", "Select a surface or polysurface")
    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({"status": "error", "error": "prompt must be a non-empty string"}), 400

    timeout_seconds = payload.get("timeout_seconds", 300.0)
    if not isinstance(timeout_seconds, (int, float)) or timeout_seconds <= 0:
        return jsonify(
            {
                "status": "error",
                "error": "timeout_seconds must be a positive number",
            }
        ), 400

    pending = queue_brep_pick_request(prompt.strip())
    deadline = time.monotonic() + float(timeout_seconds)

    while True:
        remaining_seconds = deadline - time.monotonic()
        if remaining_seconds <= 0:
            pending.cancel(
                {
                    "status": "error",
                    "error": "Timed out waiting for Rhino brep selection",
                },
                504,
            )
            return jsonify(pending.response), pending.http_status

        if pending.completed.wait(timeout=min(0.1, remaining_seconds)):
            return jsonify(pending.response), pending.http_status

        if stop_event.is_set():
            pending.cancel(
                {"status": "error", "error": "Server is shutting down"},
                503,
            )
            return jsonify(pending.response), pending.http_status


@app.post("/shutdown")
def shutdown():
    try:
        _payload_object()
    except ValueError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 400

    request_stop()
    return jsonify({"status": "accepted", "shutdown": True})
