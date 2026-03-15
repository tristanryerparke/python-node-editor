import threading

import Rhino
import System

PREVIEW_CURVE_THICKNESS = 3
PREVIEW_BREP_TRANSPARENCY = 0.35
PREVIEW_BREP_WIRE_THICKNESS = 2
PREVIEW_POINT_SIZE = 4
PREVIEW_POINT_BOUNDS_RADIUS = 1.0


class GeometryPreviewConduit(Rhino.Display.DisplayConduit):
    def __init__(self):
        super(GeometryPreviewConduit, self).__init__()
        self._lock = threading.Lock()
        self._geometry_by_id = {}
        self._brep_wire_color = System.Drawing.Color.MidnightBlue
        self._brep_material = Rhino.Display.DisplayMaterial(
            System.Drawing.Color.LightSkyBlue,
            PREVIEW_BREP_TRANSPARENCY,
        )
        self._curve_color = System.Drawing.Color.DodgerBlue
        self._point_color = System.Drawing.Color.OrangeRed

    def set_geometry(self, object_id, geometry_type, geometry):
        with self._lock:
            self._geometry_by_id[object_id] = {
                "geometry_type": geometry_type,
                "geometry": geometry,
            }

    def clear_geometries(self):
        with self._lock:
            self._geometry_by_id = {}

    def has_geometry(self):
        with self._lock:
            return bool(self._geometry_by_id)

    def _state(self):
        with self._lock:
            return list(self._geometry_by_id.items())

    def _point_bounding_box(self, point):
        return Rhino.Geometry.BoundingBox(
            Rhino.Geometry.Point3d(
                point.X - PREVIEW_POINT_BOUNDS_RADIUS,
                point.Y - PREVIEW_POINT_BOUNDS_RADIUS,
                point.Z - PREVIEW_POINT_BOUNDS_RADIUS,
            ),
            Rhino.Geometry.Point3d(
                point.X + PREVIEW_POINT_BOUNDS_RADIUS,
                point.Y + PREVIEW_POINT_BOUNDS_RADIUS,
                point.Z + PREVIEW_POINT_BOUNDS_RADIUS,
            ),
        )

    def _bounding_box(self, geometry_type, geometry):
        if geometry_type in {"brep", "curve", "polyline_curve"}:
            return geometry.GetBoundingBox(True)
        if geometry_type == "point":
            return self._point_bounding_box(geometry)
        return Rhino.Geometry.BoundingBox.Empty

    def _draw_point(self, display, point):
        try:
            display.DrawPoint(
                point,
                Rhino.Display.PointStyle.RoundSimple,
                PREVIEW_POINT_SIZE,
                self._point_color,
            )
        except TypeError:
            try:
                display.DrawPoint(point, self._point_color)
            except TypeError:
                display.DrawPoint(point)

    def CalculateBoundingBox(self, e):
        for _object_id, entry in self._state():
            geometry_type = entry["geometry_type"]
            geometry = entry["geometry"]
            if geometry is None:
                continue

            bounding_box = self._bounding_box(geometry_type, geometry)
            if bounding_box.IsValid:
                e.IncludeBoundingBox(bounding_box)

    def CalculateBoundingBoxZoomExtents(self, e):
        self.CalculateBoundingBox(e)

    def PostDrawObjects(self, e):
        for _object_id, entry in self._state():
            geometry_type = entry["geometry_type"]
            geometry = entry["geometry"]
            if geometry is None:
                continue

            if geometry_type in {"curve", "polyline_curve"}:
                e.Display.DrawCurve(
                    geometry,
                    self._curve_color,
                    PREVIEW_CURVE_THICKNESS,
                )
            elif geometry_type == "brep":
                e.Display.DrawBrepShaded(geometry, self._brep_material)
                try:
                    e.Display.DrawBrepWires(
                        geometry,
                        self._brep_wire_color,
                        PREVIEW_BREP_WIRE_THICKNESS,
                    )
                except TypeError:
                    e.Display.DrawBrepWires(geometry, self._brep_wire_color)
            elif geometry_type == "point":
                self._draw_point(e.Display, geometry)
