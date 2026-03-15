#! python3
# r: rhino3dm
import base64
import json
import urllib.error
import urllib.request

import rhino3dm

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5125
Z_OFFSET_MM = 10.0


def post_json(path, payload):
    request = urllib.request.Request(
        url=f"http://{SERVER_HOST}:{SERVER_PORT}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        response_body = exc.read().decode("utf-8")
        if response_body:
            return json.loads(response_body)
        raise


def pick_brep():
    response = post_json(
        "/pick_brep",
        {
            "prompt": "Select a surface or polysurface to send back translated",
            "timeout_seconds": 300.0,
        },
    )
    print(response)
    return response


def send_brep(brep_id, brep):
    response = post_json(
        "/geometry",
        {
            "object_id": brep_id,
            "geometry_type": "brep",
            "geometry": brep.Encode(),
        },
    )
    print(response)
    return response


def decode_brep_from_geometry_payload(payload):
    if not isinstance(payload, dict):
        return None

    try:
        decoded = rhino3dm.CommonObject.Decode(payload)
    except Exception:
        return None

    if isinstance(decoded, rhino3dm.Brep):
        return decoded
    return None


def decode_brep_from_file3dm_payload(payload):
    if not isinstance(payload, str) or not payload:
        return None

    try:
        model_bytes = base64.b64decode(payload.encode("ascii"))
        model = rhino3dm.File3dm.FromByteArray(model_bytes)
    except Exception:
        return None

    if model is None or len(model.Objects) == 0:
        return None

    geometry = model.Objects[0].Geometry
    if isinstance(geometry, rhino3dm.Brep):
        return geometry
    return None


def decode_brep(response):
    brep = decode_brep_from_geometry_payload(response.get("geometry"))
    if brep is not None:
        return brep

    brep = decode_brep_from_file3dm_payload(response.get("file3dm"))
    if brep is not None:
        return brep

    raise RuntimeError("Response did not contain a decodable rhino3dm.Brep")


def translate_upwards(brep, distance):
    transform = rhino3dm.Transform.Translation(0, 0, distance)
    if not brep.Transform(transform):
        raise RuntimeError("Failed to translate Brep")
    return brep


def main():
    response = pick_brep()
    if response.get("status") != "selected":
        return

    brep = decode_brep(response)
    translate_upwards(brep, Z_OFFSET_MM)

    object_id = response.get("object_id", "picked_brep")
    send_brep(f"{object_id}_translated_up_10mm", brep)


if __name__ == "__main__":
    main()
