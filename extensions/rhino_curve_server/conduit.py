import threading

import Rhino
import System

PREVIEW_CURVE_THICKNESS = 3
PREVIEW_BREP_TRANSPARENCY = 0
PREVIEW_BREP_WIRE_THICKNESS = 2
PREVIEW_POINT_SIZE = 4
PREVIEW_POINT_BOUNDS_RADIUS = 1.0


class GeometryPreviewConduit(Rhino.Display.DisplayConduit):
    def __init__(self):
        super(GeometryPreviewConduit, self).__init__()
        self._lock = threading.Lock()
        self._geometry_by_id = {}
        self._default_brep_wire_color = System.Drawing.Color.MidnightBlue
        self._default_brep_color = System.Drawing.Color.LightSkyBlue
        self._default_curve_color = System.Drawing.Color.DodgerBlue
        self._default_point_color = System.Drawing.Color.OrangeRed

    def set_geometry(self, object_id, geometry_type, geometry, style=None):
        with self._lock:
            existing = self._geometry_by_id.get(object_id)
            stored_style = style
            if existing is not None and style is None:
                stored_style = existing.get("style")
            self._geometry_by_id[object_id] = {
                "geometry_type": geometry_type,
                "geometry": geometry,
                "visible": True if existing is None else existing["visible"],
                "style": stored_style,
            }

    def set_visibility(self, object_id, visible):
        with self._lock:
            entry = self._geometry_by_id.get(object_id)
            if entry is None:
                return False
            entry["visible"] = bool(visible)
            return True

    def clear_geometries(self):
        with self._lock:
            self._geometry_by_id = {}

    def has_geometry(self):
        with self._lock:
            return any(
                entry["geometry"] is not None and entry["visible"]
                for entry in self._geometry_by_id.values()
            )

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
                Rhino.Display.PointStyle.X,
                PREVIEW_POINT_SIZE,
                self._default_point_color,
            )
        except TypeError:
            try:
                display.DrawPoint(point, self._default_point_color)
            except TypeError:
                display.DrawPoint(point)

    def _style_value(self, entry, key, default):
        style = entry.get("style")
        if not isinstance(style, dict) or key not in style:
            return default
        return style[key]

    def _color_with_opacity(self, rgb, opacity, fallback):
        if rgb is None:
            red = fallback.R
            green = fallback.G
            blue = fallback.B
        else:
            red, green, blue = rgb

        alpha = int(round(max(0.0, min(1.0, opacity)) * 255))
        return System.Drawing.Color.FromArgb(alpha, red, green, blue)

    def _curve_color(self, entry):
        return self._color_with_opacity(
            self._style_value(entry, "rgb", None),
            self._style_value(entry, "opacity", 1.0),
            self._default_curve_color,
        )

    def _curve_thickness(self, entry):
        return self._style_value(entry, "thickness", PREVIEW_CURVE_THICKNESS)

    def _point_color(self, entry):
        return self._color_with_opacity(
            self._style_value(entry, "rgb", None),
            self._style_value(entry, "opacity", 1.0),
            self._default_point_color,
        )

    def _brep_wire_color(self, entry):
        return self._color_with_opacity(
            self._style_value(entry, "rgb", None),
            self._style_value(entry, "opacity", 1.0),
            self._default_brep_wire_color,
        )

    def _brep_wire_thickness(self, entry):
        return self._style_value(entry, "thickness", PREVIEW_BREP_WIRE_THICKNESS)

    def _brep_material(self, entry):
        color = self._color_with_opacity(
            self._style_value(entry, "rgb", None),
            self._style_value(entry, "opacity", 1.0 - PREVIEW_BREP_TRANSPARENCY),
            self._default_brep_color,
        )
        material = Rhino.Display.DisplayMaterial(
            color,
            1.0 - self._style_value(entry, "opacity", 1.0 - PREVIEW_BREP_TRANSPARENCY),
        )
        material.Diffuse = color
        return material

    def _draw_styled_point(self, display, entry, point):
        point_color = self._point_color(entry)
        try:
            display.DrawPoint(
                point,
                Rhino.Display.PointStyle.X,
                PREVIEW_POINT_SIZE,
                point_color,
            )
        except TypeError:
            try:
                display.DrawPoint(point, point_color)
            except TypeError:
                display.DrawPoint(point)

    def _draw_brep_edges(self, display, brep, color, thickness):
        for edge in brep.Edges:
            if edge is None:
                continue
            display.DrawCurve(edge, color, thickness)

    def CalculateBoundingBox(self, e):
        for _object_id, entry in self._state():
            geometry_type = entry["geometry_type"]
            geometry = entry["geometry"]
            if geometry is None or not entry["visible"]:
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
            if geometry is None or not entry["visible"]:
                continue

            if geometry_type in {"curve", "polyline_curve"}:
                e.Display.DrawCurve(
                    geometry,
                    self._curve_color(entry),
                    self._curve_thickness(entry),
                )
            elif geometry_type == "brep":
                e.Display.DrawBrepShaded(geometry, self._brep_material(entry))
                self._draw_brep_edges(
                    e.Display,
                    geometry,
                    self._brep_wire_color(entry),
                    self._brep_wire_thickness(entry),
                )
            elif geometry_type == "point":
                self._draw_styled_point(e.Display, entry, geometry)
