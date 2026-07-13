from __future__ import annotations

from .registry import PluginRegistration, PluginRegistry


class PluginContext:
    def __init__(self, registry: PluginRegistry) -> None:
        self.registry = registry

    def register_plugin(self, plugin: PluginRegistration) -> None:
        self.registry.register(plugin)
