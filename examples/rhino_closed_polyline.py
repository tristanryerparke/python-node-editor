import math

from examples.user_model import Point2D
import rhino3dm
from rhino_renderer import FileClient, active_document
from shapely.geometry import LineString

from python_node_editor.display import retrieve_input_data
from python_node_editor.runtime import post_execution_hook
from python_node_editor.schema_base import UserModel

_RESOLVED_PREVIEW_OBJECT_ID = "pne.closed_polyline.resolved"
_BUFFERED_PREVIEW_OBJECT_ID = "pne.closed_polyline.buffered"
_RESOLVED_PREVIEW_STYLE = {"rgb": [220, 140, 40], "opacity": 0.9, "thickness": 2}
_BUFFERED_PREVIEW_STYLE = {"rgb": [20, 180, 120], "opacity": 0.95, "thickness": 3}


def _point_distance(a, b):
    dx = a[0] - b[0]
    dy = a[1] - b[1]
    dz = a[2] - b[2]
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def _polyline_points_from_geometry(geometry):
    polyline = None
    if hasattr(geometry, "TryGetPolyline"):
        polyline = geometry.TryGetPolyline()
    if polyline is None and hasattr(geometry, "ToPolyline"):
        polyline = geometry.ToPolyline()

    if polyline is None:
        raise ValueError("Selected geometry is not a polyline curve")

    points = [
        (polyline[i].X, polyline[i].Y, polyline[i].Z) for i in range(len(polyline))
    ]

    if len(points) < 4:
        raise ValueError("Polyline must have at least 4 points")

    if _point_distance(points[0], points[-1]) > 1e-9:
        raise ValueError("Selected polyline is not closed")

    return points


def _to_closed_polyline(points):
    return ClosedPolyline(
        vertices=[Point2D(x=float(x), y=float(y)) for x, y, _ in points]
    )


def _is_same_xy_point(a, b):
    return math.isclose(a[0], b[0], abs_tol=1e-9) and math.isclose(
        a[1], b[1], abs_tol=1e-9
    )


def _closed_xy_vertices(polyline: "ClosedPolyline"):
    coords = [(float(vertex.x), float(vertex.y)) for vertex in polyline.vertices]
    if len(coords) < 3:
        raise ValueError("ClosedPolyline must have at least 3 vertices")
    if not _is_same_xy_point(coords[0], coords[-1]):
        coords.append(coords[0])
    return coords


def _to_rhino_polyline_curve(polyline: "ClosedPolyline"):
    coords = _closed_xy_vertices(polyline)
    rhino_polyline = rhino3dm.Polyline()
    for x, y in coords:
        rhino_polyline.Add(float(x), float(y), 0.0)
    return rhino3dm.PolylineCurve(rhino_polyline)


def _preview_resolved_polyline_in_rhino(output) -> None:
    try:
        parsed_polyline = output
        if isinstance(parsed_polyline, dict):
            parsed_polyline = ClosedPolyline.model_validate(parsed_polyline)
        if not isinstance(parsed_polyline, ClosedPolyline):
            return

        doc = active_document()
        client = FileClient(doc=doc)
        client.upsert_geometry(
            geometry=_to_rhino_polyline_curve(parsed_polyline),
            object_id=_RESOLVED_PREVIEW_OBJECT_ID,
            style=_RESOLVED_PREVIEW_STYLE,
        )
    except Exception as exc:
        print(f"Warning: failed to preview resolved polyline in Rhino: {exc}")


def _preview_buffered_polyline_in_rhino(output) -> None:
    try:
        buffered_polyline = output
        if isinstance(buffered_polyline, dict):
            buffered_polyline = ClosedPolyline.model_validate(buffered_polyline)
        if not isinstance(buffered_polyline, ClosedPolyline):
            return

        doc = active_document()
        client = FileClient(doc=doc)
        client.upsert_geometry(
            geometry=_to_rhino_polyline_curve(buffered_polyline),
            object_id=_BUFFERED_PREVIEW_OBJECT_ID,
            style=_BUFFERED_PREVIEW_STYLE,
        )
    except Exception as exc:
        print(f"Warning: failed to preview buffered polyline in Rhino: {exc}")


def _retrieve_rhino_polyline_from_rhino():
    doc = active_document()
    client = FileClient(doc=doc)

    selected = client.get_object(
        prompt="Select one closed polyline",
        object_type="Curve",
    )

    if selected is None:
        raise ValueError("No geometry returned from Rhino")

    return RhinoPolyline(guid=str(selected.guid))


def _closed_polyline_from_rhino_guid(guid):
    doc = active_document()
    client = FileClient(doc=doc)
    rhino_object = client.rhino_objects.sync(guid)
    points = _polyline_points_from_geometry(rhino_object.geometry)
    return _to_closed_polyline(points)


@retrieve_input_data(_retrieve_rhino_polyline_from_rhino)
class RhinoPolyline(UserModel):
    guid: str


class ClosedPolyline(UserModel):
    vertices: list[Point2D]


@post_execution_hook(_preview_resolved_polyline_in_rhino)
def rhino_polyline_to_pne(rhino_polyline: RhinoPolyline) -> ClosedPolyline:
    return _closed_polyline_from_rhino_guid(rhino_polyline.guid)


@post_execution_hook(_preview_buffered_polyline_in_rhino)
def buffer_closed_polyline(
    polyline: ClosedPolyline, distance: float = 2.0
) -> ClosedPolyline:
    line = LineString([(p.x, p.y) for p in polyline.vertices])

    if not line.is_ring:
        raise ValueError("Input polyline must be closed")

    buffered = line.buffer(distance)
    if buffered.is_empty:
        raise ValueError("Buffer operation produced empty geometry")

    if buffered.geom_type == "MultiPolygon":
        polygon = max(buffered.geoms, key=lambda g: g.area)
    elif buffered.geom_type == "Polygon":
        polygon = buffered
    else:
        raise ValueError("Buffer result is not a polygon: " + buffered.geom_type)

    vertices = [
        Point2D(x=float(coord[0]), y=float(coord[1]))
        for coord in polygon.exterior.coords
    ]
    return ClosedPolyline(vertices=vertices)
