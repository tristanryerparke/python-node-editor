from __future__ import annotations

import importlib.metadata

from .assets import FrontendPluginAsset
from .context import PluginContext
from .registry import PluginRegistration, PluginRegistry

ENTRY_POINT_GROUP = "python_node_editor.plugins"


def load_installed_plugins(context: PluginContext) -> None:
    entry_points = importlib.metadata.entry_points(group=ENTRY_POINT_GROUP)

    for entry_point in entry_points:
        activate = entry_point.load()
        activate(context)


__all__ = [
    "ENTRY_POINT_GROUP",
    "FrontendPluginAsset",
    "PluginContext",
    "PluginRegistration",
    "PluginRegistry",
    "load_installed_plugins",
]
