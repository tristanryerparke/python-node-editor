import logging
import os
import sys
from contextlib import asynccontextmanager

from devtools import debug as d
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from python_node_editor.analysis.utils import (
    analyze_file_structure,
    split_search_path_and_function,
)
from python_node_editor.execution.exec_async import router as execute_async_router
from python_node_editor.execution.exec_sync import router as execute_sync_router
from python_node_editor.large_data.large_files_endpoint import (
    router as large_data_router,
)
from python_node_editor.plugins import (
    PluginContext,
    PluginRegistry,
    load_installed_plugins,
)

FUNCTION_SCHEMAS = []
CALLABLES = {}
TYPES = {}
PLUGIN_REGISTRY = PluginRegistry()
PLUGINS_LOADED = False
PLUGIN_ASSETS_MOUNTED = False
VERBOSE = False
IGNORE_UNDERSCORE_PREFIX = True
SERVE_FRONTEND = False


class _HealthCheckAccessFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        if " /api/health " in message or " /api/health?" in message:
            return False
        return True


def _attach_access_log_filter() -> None:
    logger = logging.getLogger("uvicorn.access")
    if any(
        isinstance(existing, _HealthCheckAccessFilter) for existing in logger.filters
    ):
        return
    logger.addFilter(_HealthCheckAccessFilter())


def ensure_plugins_loaded() -> PluginRegistry:
    """Discover installed plugins once for this backend process."""
    global PLUGINS_LOADED
    if not PLUGINS_LOADED:
        plugin_context = PluginContext(PLUGIN_REGISTRY)
        load_installed_plugins(plugin_context)
        PLUGINS_LOADED = True
    return PLUGIN_REGISTRY


def mount_plugin_assets() -> None:
    """Mount frontend assets for installed plugins.

    This must run before the frontend catch-all mount.
    """
    global PLUGIN_ASSETS_MOUNTED
    if PLUGIN_ASSETS_MOUNTED:
        return

    ensure_plugins_loaded()
    for frontend_plugin in PLUGIN_REGISTRY.frontend_plugins:
        app.mount(
            f"/plugin-assets/{frontend_plugin.id}",
            StaticFiles(directory=frontend_plugin.asset_dir),
            name=f"plugin-assets-{frontend_plugin.id}",
        )

    PLUGIN_ASSETS_MOUNTED = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load functions and types from the provided path arguments"""
    global FUNCTION_SCHEMAS, CALLABLES, TYPES
    ensure_plugins_loaded()
    args = sys.argv[1:]
    if len(args) == 0:
        print("No arguments provided")
        sys.exit(1)
    search_paths_input: str = args[0]
    search_paths = [p.strip() for p in search_paths_input.split(",")]

    for search_path in search_paths:
        # Allow function selectors like path:func by splitting before existence check
        path_part, _ = split_search_path_and_function(search_path)
        if not os.path.exists(path_part):
            print(f"The path {path_part} does not exist")
            sys.exit(1)

    function_schemas, callables, types = analyze_file_structure(
        search_paths, ignore_underscore_prefix=IGNORE_UNDERSCORE_PREFIX
    )
    FUNCTION_SCHEMAS.extend(function_schemas)
    CALLABLES.update(callables)
    TYPES.update(types)

    print(f"Found {len(FUNCTION_SCHEMAS)} functions and {len(TYPES)} types")

    if VERBOSE:
        d(FUNCTION_SCHEMAS)
        d(TYPES)

    yield


# Create the FastAPI app
app = FastAPI(
    title="Python Node Editor",
    version="1.0.0",
    lifespan=lifespan,
)
_attach_access_log_filter()

# Include routers
app.include_router(execute_sync_router)
app.include_router(execute_async_router)
app.include_router(large_data_router, tags=["data"])


def _serialize_function_schemas():
    return [
        schema.model_dump(mode="json", exclude_defaults=True, exclude_none=True)
        for schema in FUNCTION_SCHEMAS
    ]


def _serialize_types():
    types_serialized = {}
    for k, v in TYPES.items():
        # Use model_dump which will automatically exclude _class and referenced_datamodel
        # and convert snake_case to camelCase for StructDescr/UnionDescr instances
        types_serialized[k] = v.model_dump(mode="json")
    return types_serialized


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/environment")
async def get_environment():
    """Get the loaded function schemas and type metadata used by the frontend."""
    return {
        "nodes": _serialize_function_schemas(),
        "types": _serialize_types(),
        "plugins": PLUGIN_REGISTRY.serialize_frontend_plugins(),
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


def mount_frontend():
    """Mount frontend static files. Called from CLI after setting SERVE_FRONTEND flag."""
    if SERVE_FRONTEND:
        frontend_prebuilt = get_frontend_prebuilt_dir()
        if frontend_prebuilt:
            app.mount(
                "/", StaticFiles(directory=frontend_prebuilt, html=True), name="static"
            )


def get_frontend_prebuilt_dir():
    prebuilt_dir = os.path.join(os.path.dirname(__file__), "prebuilt_frontend")
    if os.path.isdir(prebuilt_dir):
        return prebuilt_dir
    return None
