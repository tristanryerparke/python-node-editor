from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .assets import FrontendPluginAsset


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
            raise ValueError(f"Plugin is already registered: {plugin.id}")
        if plugin.frontend is not None and plugin.frontend.id != plugin.id:
            raise ValueError(
                f"Frontend asset id {plugin.frontend.id!r} must match "
                f"plugin id {plugin.id!r}"
            )
        self._plugins[plugin.id] = plugin

    @property
    def plugins(self) -> tuple[PluginRegistration, ...]:
        return tuple(self._plugins.values())

    @property
    def frontend_plugins(self) -> tuple[FrontendPluginAsset, ...]:
        return tuple(
            plugin.frontend
            for plugin in self._plugins.values()
            if plugin.frontend is not None
        )

    def serialize_frontend_plugins(self) -> list[dict[str, str]]:
        return [frontend.serialize() for frontend in self.frontend_plugins]

    def __iter__(self) -> Iterable[PluginRegistration]:
        return iter(self._plugins.values())
