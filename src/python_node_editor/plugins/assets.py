from __future__ import annotations

import importlib.metadata
from collections.abc import Iterable

from .context import PluginContext

ENTRY_POINT_GROUP = "python_node_editor.plugins"


def _iter_entry_points() -> Iterable[importlib.metadata.EntryPoint]:
    entry_points = importlib.metadata.entry_points()
    if hasattr(entry_points, "select"):
        return entry_points.select(group=ENTRY_POINT_GROUP)
    return entry_points.get(ENTRY_POINT_GROUP, ())  # type: ignore[union-attr]


def load_installed_plugins(context: PluginContext) -> None:
    for entry_point in _iter_entry_points():
        activate = entry_point.load()
        activate(context)
