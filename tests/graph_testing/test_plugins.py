from pathlib import Path

import python_node_editor.plugins as plugins_module
import python_node_editor.server as server_module
from python_node_editor.plugins import (
    FrontendPluginAsset,
    PluginContext,
    PluginRegistration,
    PluginRegistry,
    load_installed_plugins,
)


def test_plugin_registry_serializes_frontend_assets():
    registry = PluginRegistry()
    registry.register(
        PluginRegistration(
            id="test-plugin",
            name="Test Plugin",
            version="0.1.0",
            frontend=FrontendPluginAsset(
                id="test-plugin",
                asset_dir=Path("/tmp/test-plugin"),
                js="test-plugin.js",
                css="test-plugin.css",
            ),
        )
    )

    assert registry.serialize_frontend_plugins() == [
        {
            "id": "test-plugin",
            "js": "/plugin-assets/test-plugin/test-plugin.js",
            "css": "/plugin-assets/test-plugin/test-plugin.css",
        }
    ]


def test_load_installed_plugins_uses_entry_points(monkeypatch):
    activated = False

    def activate(ctx):
        nonlocal activated
        activated = True
        ctx.register_plugin(
            PluginRegistration(id="entry-plugin", name="Entry Plugin", version="1.0")
        )

    class EntryPoint:
        def load(self):
            return activate

    monkeypatch.setattr(
        plugins_module.importlib.metadata,
        "entry_points",
        lambda group: [EntryPoint()] if group == plugins_module.ENTRY_POINT_GROUP else [],
    )

    registry = PluginRegistry()
    load_installed_plugins(PluginContext(registry))

    assert activated is True
    assert [plugin.id for plugin in registry.plugins] == ["entry-plugin"]


def test_environment_route_includes_plugins():
    original_registry = server_module.PLUGIN_REGISTRY
    try:
        registry = PluginRegistry()
        registry.register(
            PluginRegistration(
                id="test-plugin",
                name="Test Plugin",
                version="0.1.0",
                frontend=FrontendPluginAsset(
                    id="test-plugin",
                    asset_dir=Path("/tmp/test-plugin"),
                    js="test-plugin.js",
                ),
            )
        )
        server_module.PLUGIN_REGISTRY = registry

        assert server_module.PLUGIN_REGISTRY.serialize_frontend_plugins() == [
            {
                "id": "test-plugin",
                "js": "/plugin-assets/test-plugin/test-plugin.js",
            }
        ]
    finally:
        server_module.PLUGIN_REGISTRY = original_registry
