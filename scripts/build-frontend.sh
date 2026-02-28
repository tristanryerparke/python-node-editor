#!/bin/sh
set -e

uv run python -c "from python_node_editor.cli import build_frontend; build_frontend()"
