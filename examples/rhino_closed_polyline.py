import math

from examples.user_model import Point2D
from rhino_renderer import (
    ConduitAction,
    ConduitGeometry,
    FileClient,
    ObjectStyle,
    current_document_path,
    encode_polyline_from_points,
)
from rhino_renderer.action import RGBColor
from shapely.geometry import LineString

from python_node_editor.display import retrieve_input_data
from python_node_editor.runtime import post_execution_hook
from python_node_editor.schema_base import UserModel

_PREVIEW_GROUP_ID = "pne.closed_polyline"
_RESOLVED_PREVIEW_OBJECT_ID = "pne.closed_polyline.resolved"
_BUFFERED_PREVIEW_OBJECT_ID = "pne.closed_polyline.buffered"
_RESOLVED_PREVIEW_STYLE = ObjectStyle(
    color=RGBColor(red=220, green=140, blue=40),
    opacity=0.9,
    line_width=2,
)
_BUFFERED_PREVIEW_STYLE = ObjectStyle(
    color=RGBColor(red=20, green=180, blue=120),
    opacity=0.95,
    line_width=3,
)


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


def _to_point2d_vertices(points):
    return [Point2D(x=float(x), y=float(y)) for x, y, _ in points]


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


def _preview_points(polyline: "ClosedPolyline"):
    return [(x, y, 0.0) for x, y in _closed_xy_vertices(polyline)]


def _client_for_active_document(timeout_seconds=10.0):
    file_path = current_document_path()
    if not file_path:
        raise RuntimeError("Could not determine active Rhino document path")

    return FileClient(
        file_path=file_path,
        timeout_seconds=timeout_seconds,
        group_ids=[_PREVIEW_GROUP_ID],
    )


def _upsert_preview_polyline(object_id, polyline: "ClosedPolyline", style) -> None:
    client = _client_for_active_document()
    client.run_action(
        ConduitAction(
            group_id=_PREVIEW_GROUP_ID,
            object_id=object_id,
            action="upsert",
            geometry=ConduitGeometry(
                type="polyline",
                geometry_string=encode_polyline_from_points(_preview_points(polyline)),
                style=style,
            ),
        )
    )


def _preview_resolved_polyline_in_rhino(output) -> None:
    try:
        parsed_polyline = output
        if isinstance(parsed_polyline, dict):
            parsed_polyline = ClosedPolyline.model_validate(parsed_polyline)
        if not isinstance(parsed_polyline, ClosedPolyline):
            return

        _upsert_preview_polyline(
            _RESOLVED_PREVIEW_OBJECT_ID,
            parsed_polyline,
            _RESOLVED_PREVIEW_STYLE,
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

        _upsert_preview_polyline(
            _BUFFERED_PREVIEW_OBJECT_ID,
            buffered_polyline,
            _BUFFERED_PREVIEW_STYLE,
        )
    except Exception as exc:
        print(f"Warning: failed to preview buffered polyline in Rhino: {exc}")


def _retrieve_rhino_polyline_from_rhino():
    client = _client_for_active_document(timeout_seconds=45.0)
    selected_geometry = client.prompt_select_geometry(
        prompt="Select one closed polyline",
        object_type="curve",
        require_enter=True,
    )

    if selected_geometry is None:
        raise ValueError("No geometry returned from Rhino")

    points = _polyline_points_from_geometry(selected_geometry)
    return RhinoPolyline(vertices=_to_point2d_vertices(points))


@retrieve_input_data(_retrieve_rhino_polyline_from_rhino)
class RhinoPolyline(UserModel):
    vertices: list[Point2D]


class ClosedPolyline(UserModel):
    vertices: list[Point2D]


@post_execution_hook(_preview_resolved_polyline_in_rhino)
def rhino_polyline_to_pne(rhino_polyline: RhinoPolyline) -> ClosedPolyline:
    return ClosedPolyline(vertices=list(rhino_polyline.vertices))


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
