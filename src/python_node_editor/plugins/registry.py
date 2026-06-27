from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote


@dataclass(frozen=True)
class FrontendPluginAsset:
    id: str
    asset_dir: Path
    js: str
    css: str | None = None


@dataclass(frozen=True)
class PluginRegistration:
    id: str
    name: str
    version: str
    frontend: FrontendPluginAsset | None = None


class PluginRegistry:
    def __init__(self) -> None:
        self._plugins: dict[str, PluginRegistration] = {}

    def register(self, plugin: PluginRegistration) -> None:
        if plugin.id in self._plugins:
            existing = self._plugins[plugin.id]
            raise ValueError(
                f"Plugin id {plugin.id!r} is already registered "
                f"by {existing.name!r} ({existing.version})"
            )
        self._plugins[plugin.id] = plugin

    @property
    def plugins(self) -> tuple[PluginRegistration, ...]:
        return tuple(self._plugins.values())

    @property
    def frontend_plugins(self) -> tuple[PluginRegistration, ...]:
        return tuple(plugin for plugin in self._plugins.values() if plugin.frontend)

    def serialize_frontend_plugins(self) -> list[dict[str, Any]]:
        return [
            self._serialize_frontend_plugin(plugin)
            for plugin in self.frontend_plugins
            if plugin.frontend is not None
        ]

    @staticmethod
    def _serialize_frontend_plugin(plugin: PluginRegistration) -> dict[str, Any]:
        frontend = plugin.frontend
        if frontend is None:
            raise ValueError("Cannot serialize plugin without frontend assets")

        plugin_id = quote(plugin.id, safe="")
        descriptor: dict[str, Any] = {
            "id": plugin.id,
            "js": f"/plugin-assets/{plugin_id}/{frontend.js.lstrip('/')}",
        }
        if frontend.css:
            descriptor["css"] = f"/plugin-assets/{plugin_id}/{frontend.css.lstrip('/')}"
        return descriptor
