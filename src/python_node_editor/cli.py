def _parse_backend_args(builds_frontend):
    import argparse

    parser = argparse.ArgumentParser(description="Run the Python Node Editor backend")
    parser.add_argument(
        "path", help="Comma-separated paths to analyze for functions and types"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--do_not_ignore_underscore_prefix",
        action="store_true",
        help="Do not ignore files, folders, and functions starting with underscore",
    )
    if builds_frontend:
        parser.add_argument(
            "-bf",
            "--build_frontend",
            action="store_true",
            help="Force rebuild of the frontend before serving",
        )
    # Common uvicorn options
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    args = parser.parse_args()

    args.frontend = builds_frontend

    return args


def _build_frontend_package(frontend_dir, label="Frontend"):
    import subprocess
    import sys

    # Run bun i
    print(f"{label}: Installing dependencies...", end="", flush=True)
    result = subprocess.run(["bun", "i"], cwd=frontend_dir, capture_output=True)
    if result.returncode != 0:
        print(f"\nError installing dependencies for {label}: {result.stderr.decode()}")
        sys.exit(1)

    # Run bun run build
    print(f"\r{label}: Building...                          ", end="", flush=True)
    result = subprocess.run(
        ["bun", "run", "build"], cwd=frontend_dir, capture_output=True
    )
    if result.returncode != 0:
        print(f"\nError building {label}: {result.stderr.decode()}")
        sys.exit(1)

    print(f"\r{label}: Build complete!                      ")


def _build_frontend(frontend_dir=None):
    import os
    import shutil
    import sys

    if frontend_dir is None:
        frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
    frontend_dist_dir = os.path.join(frontend_dir, "dist")
    frontend_prebuilt_dir = os.path.join(os.path.dirname(__file__), "prebuilt_frontend")

    _build_frontend_package(frontend_dir)

    if not os.path.isdir(frontend_dist_dir):
        print("\nError building frontend: dist folder not found.")
        sys.exit(1)

    shutil.rmtree(frontend_prebuilt_dir, ignore_errors=True)
    shutil.copytree(frontend_dist_dir, frontend_prebuilt_dir)


def _has_frontend_build_script(frontend_dir):
    import json

    package_json_path = frontend_dir / "package.json"
    if not package_json_path.is_file():
        return False

    try:
        package_json = json.loads(package_json_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False

    scripts = package_json.get("scripts")
    return isinstance(scripts, dict) and "build" in scripts


def _find_plugin_frontend_source_dir(asset_dir):
    from pathlib import Path

    asset_path = Path(asset_dir).resolve()
    candidates = []
    for parent in (asset_path, *asset_path.parents):
        if parent.name == "frontend":
            candidates.append(parent)
        candidates.append(parent / "frontend")
        candidates.append(parent)

    seen = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        if _has_frontend_build_script(candidate):
            return candidate

    return None


def _build_detected_plugin_frontends(plugin_registry):
    seen_frontend_dirs = set()

    for plugin in plugin_registry.frontend_plugins:
        if plugin.frontend is None:
            continue

        frontend_source_dir = _find_plugin_frontend_source_dir(
            plugin.frontend.asset_dir
        )
        if frontend_source_dir is None:
            print(
                f"Plugin {plugin.id}: frontend source folder not found; "
                "skipping plugin frontend build."
            )
            continue

        if frontend_source_dir in seen_frontend_dirs:
            continue

        seen_frontend_dirs.add(frontend_source_dir)
        _build_frontend_package(frontend_source_dir, label=f"Plugin {plugin.id}")


def _run_backend(args):
    import os
    import sys

    import uvicorn

    import python_node_editor.execution.exec_utils as exec_utils
    import python_node_editor.server as server_module

    if args.frontend:
        if args.build_frontend:
            frontend_source_dir = os.path.join(
                os.path.dirname(__file__), "..", "..", "frontend"
            )
            if not os.path.isdir(frontend_source_dir):
                print(
                    "Frontend: source folder not found. "
                    "Reinstall from source or use a dev checkout."
                )
                sys.exit(1)
            server_module.load_plugins_once()
            _build_frontend(frontend_source_dir)
            _build_detected_plugin_frontends(server_module.PLUGIN_REGISTRY)
        elif not server_module.get_frontend_prebuilt_dir():
            print("Frontend: prebuilt folder not found. Run with -bf to build it.")
            sys.exit(1)

    # Store verbose flag globally for server and execution modules to access
    server_module.VERBOSE = args.verbose
    exec_utils.VERBOSE = args.verbose
    server_module.IGNORE_UNDERSCORE_PREFIX = not args.do_not_ignore_underscore_prefix
    server_module.SERVE_FRONTEND = args.frontend

    # Reconstruct sys.argv for the lifespan handler to read the paths
    sys.argv = [sys.argv[0], args.path]

    from python_node_editor.server import app as fastapi_app

    # Mount frontend static files if requested (must be done after all routes are added)
    if args.frontend:
        server_module.mount_frontend()
        # ANSI escape codes for blue and clickable link
        blue = "\033[94m\033]8;;"
        reset = "\033]8;;\033\\\033[0m"
        frontend_url = f"http://{args.host}:{args.port}"
        print(f"Frontend available at: {blue}{frontend_url}\033\\{frontend_url}{reset}")

    uvicorn.run(fastapi_app, host=args.host, port=args.port, reload=args.reload)


def main():
    args = _parse_backend_args(builds_frontend=True)
    _run_backend(args)


def backend_only():
    args = _parse_backend_args(builds_frontend=False)
    _run_backend(args)


def build_frontend():
    _build_frontend()


def analyze():
    import argparse
    import json
    import os

    from devtools import debug as d

    from python_node_editor.analysis.utils import (
        FunctionNotFoundError,
        analyze_file_structure,
        split_search_path_and_function,
    )

    parser = argparse.ArgumentParser(
        description="Analyze Python files for functions and types"
    )
    parser.add_argument(
        "path", help="Comma-separated paths to analyze for functions and types"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--do_not_ignore_underscore_prefix",
        action="store_true",
        help="Do not ignore files, folders, and functions starting with underscore",
    )
    parser.add_argument(
        "-j",
        "--json",
        nargs="?",
        const="-",
        metavar="OUTPUT_FILE",
        help="Output analysis as JSON. Use -j for stdout or -j <file> to write a file.",
    )

    args = parser.parse_args()

    search_paths = [p.strip() for p in args.path.split(",")]

    for search_path in search_paths:
        path_part, function_name = split_search_path_and_function(search_path)
        if not os.path.exists(path_part):
            print(f"The path {search_path} does not exist")
            exit(1)
        if function_name is not None and os.path.isdir(path_part):
            print(
                f"The function selector in {search_path} is only supported for Python files"
            )
            exit(1)

    if args.json is None:
        print(f"Analyzing: {', '.join(search_paths)}")
    ignore_underscore = not args.do_not_ignore_underscore_prefix
    try:
        function_schemas, callables, types = analyze_file_structure(
            search_paths, ignore_underscore_prefix=ignore_underscore
        )
    except (FunctionNotFoundError, ValueError) as error:
        print(error)
        exit(1)

    if args.json is not None:
        serialized_function_schemas = [
            schema.model_dump(mode="json", exclude_defaults=True, exclude_none=True)
            for schema in function_schemas
        ]
        serialized_types = {
            k: v.model_dump(mode="json", exclude_defaults=True, exclude_none=True)
            for k, v in types.items()
        }
        json_output = json.dumps(
            {
                "FUNCTION_SCHEMAS": serialized_function_schemas,
                "TYPES": serialized_types,
            },
            indent=2,
        )

        if args.json == "-":
            print(json_output)
            return

        try:
            with open(args.json, "w", encoding="utf-8") as f:
                f.write(json_output + "\n")
        except OSError as error:
            print(f"Could not write JSON output to {args.json}: {error}")
            exit(1)
        return

    print(f"\nFound {len(function_schemas)} functions and {len(types)} types")

    if args.verbose:
        print("\nFUNCTION_SCHEMAS:")
        serialized_function_schemas = [
            schema.model_dump(mode="json", exclude_defaults=True, exclude_none=True)
            for schema in function_schemas
        ]
        d(serialized_function_schemas)
        print("\nTYPES:")
        serialized_types = {
            k: v.model_dump(mode="json", exclude_defaults=True, exclude_none=True)
            for k, v in types.items()
        }
        d(serialized_types)
