from __future__ import annotations


def infer_plugin_package_name(module_name: str) -> str | None:
    """Infer a PyPI package name from a PNE plugin import module name."""
    if "." in module_name or not module_name.startswith("pne_"):
        return None

    plugin_name = module_name.removeprefix("pne_").replace("_", "-")
    if not plugin_name:
        return None

    return f"pne-plugin-{plugin_name}"


def format_plugin_not_installed_message(
    module_name: str, package_name: str | None = None
) -> str:
    package_name = package_name or infer_plugin_package_name(module_name)
    if package_name:
        return (
            f"PNE plugin {package_name!r} is not installed "
            f"(missing module {module_name!r}). "
            f"Install it with: uv add {package_name}"
        )

    return (
        f"PNE plugin module {module_name!r} is not installed. "
        "Install the plugin package and try again."
    )


class PluginNotInstalledError(ModuleNotFoundError):
    """Raised when user code references a PNE plugin package that is missing."""

    def __init__(self, module_name: str, package_name: str | None = None) -> None:
        self.module_name = module_name
        self.package_name = package_name or infer_plugin_package_name(module_name)
        super().__init__(
            format_plugin_not_installed_message(module_name, self.package_name)
        )
        self.name = module_name


def missing_plugin_error_from_module_not_found(
    exc: ModuleNotFoundError,
) -> PluginNotInstalledError | None:
    module_name = exc.name
    if not module_name or infer_plugin_package_name(module_name) is None:
        return None

    return PluginNotInstalledError(module_name)
