import rhino3dm

SUPPORTED_GEOMETRY_TYPES = {
    "brep",
    "curve",
    "point",
    "polyline_curve",
}


def object_id_from_payload(payload):
    object_id = (
        payload.get("object_id")
        or payload.get("objectId")
        or payload.get("curve_id")
        or payload.get("curveId")
    )
    if not isinstance(object_id, str) or not object_id.strip():
        raise ValueError("object_id must be a non-empty string")
    return object_id.strip()


def geometry_payload_from_payload(payload):
    geometry_payload = payload.get("geometry")
    if geometry_payload is None and "curve" in payload:
        geometry_payload = payload.get("curve")

    if not isinstance(geometry_payload, dict):
        raise ValueError("geometry must be a JSON object produced by .Encode()")
    return geometry_payload


def looks_like_point_payload(geometry_payload):
    return all(key in geometry_payload for key in ("X", "Y", "Z"))


def looks_like_common_object_payload(geometry_payload):
    return all(key in geometry_payload for key in ("archive3dm", "opennurbs", "data"))


def decode_common_object_payload(geometry_payload):
    return rhino3dm.CommonObject.Decode(geometry_payload)


def infer_geometry_type(payload, geometry_payload):
    geometry_type = payload.get("geometry_type", payload.get("geometryType"))
    if geometry_type is None and "curve" in payload:
        geometry_type = "curve"

    if geometry_type is not None:
        return geometry_type

    if looks_like_point_payload(geometry_payload):
        return "point"

    if not looks_like_common_object_payload(geometry_payload):
        return None

    try:
        decoded_geometry = decode_common_object_payload(geometry_payload)
    except Exception as exc:
        raise ValueError(f"Unable to decode encoded geometry payload: {exc}")

    if isinstance(decoded_geometry, rhino3dm.PolylineCurve):
        return "polyline_curve"
    if isinstance(decoded_geometry, rhino3dm.Brep):
        return "brep"
    if isinstance(decoded_geometry, rhino3dm.Curve):
        return "curve"
    return None


def geometry_type_from_payload(payload, geometry_payload):
    geometry_type = infer_geometry_type(payload, geometry_payload)
    if not isinstance(geometry_type, str) or geometry_type not in SUPPORTED_GEOMETRY_TYPES:
        supported_types = ", ".join(sorted(SUPPORTED_GEOMETRY_TYPES))
        raise ValueError(f"geometry_type must be one of: {supported_types}")
    return geometry_type


def validate_point_payload(geometry_payload):
    try:
        return {
            "X": float(geometry_payload["X"]),
            "Y": float(geometry_payload["Y"]),
            "Z": float(geometry_payload["Z"]),
        }
    except (KeyError, TypeError, ValueError):
        raise ValueError("point geometry must contain numeric X, Y, and Z values")


def validate_common_object_payload(geometry_payload, expected_class, geometry_type):
    if not looks_like_common_object_payload(geometry_payload):
        raise ValueError(
            f"{geometry_type} geometry must be a JSON object produced by rhino3dm.CommonObject.Encode()"
        )

    try:
        decoded_geometry = decode_common_object_payload(geometry_payload)
    except Exception as exc:
        raise ValueError(f"Unable to decode rhino3dm {geometry_type} payload: {exc}")

    if not isinstance(decoded_geometry, expected_class):
        raise ValueError(
            f"{geometry_type} payload did not decode to a {expected_class.__name__}"
        )

    is_valid = getattr(decoded_geometry, "IsValid", True)
    if not is_valid:
        raise ValueError(f"Decoded rhino3dm {geometry_type} is invalid")

    return geometry_payload


def validate_geometry_payload(geometry_type, geometry_payload):
    if geometry_type == "point":
        return validate_point_payload(geometry_payload)
    if geometry_type == "curve":
        return validate_common_object_payload(
            geometry_payload,
            rhino3dm.Curve,
            "curve",
        )
    if geometry_type == "polyline_curve":
        return validate_common_object_payload(
            geometry_payload,
            rhino3dm.PolylineCurve,
            "polyline_curve",
        )
    if geometry_type == "brep":
        return validate_common_object_payload(
            geometry_payload,
            rhino3dm.Brep,
            "brep",
        )
    raise ValueError(f"Unsupported geometry_type: {geometry_type}")


def validated_geometry_update(payload):
    geometry_payload = geometry_payload_from_payload(payload)
    geometry_type = geometry_type_from_payload(payload, geometry_payload)
    geometry_payload = validate_geometry_payload(geometry_type, geometry_payload)

    return {
        "object_id": object_id_from_payload(payload),
        "geometry_type": geometry_type,
        "geometry_payload": geometry_payload,
    }
