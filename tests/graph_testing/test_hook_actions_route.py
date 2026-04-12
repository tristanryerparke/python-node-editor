from contextlib import asynccontextmanager

from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from tests.assets.hook_actions import (
    HOOK_ACTION_EVENTS,
    add_with_lifecycle_hooks,
    reset_hook_action_events,
)


@asynccontextmanager
async def _noop_lifespan(app):
    yield


def test_hook_actions_route_runs_add_and_delete_hooks_in_order():
    _, schema, _, _ = analyze_function(add_with_lifecycle_hooks)

    original_function_schemas = list(server_module.FUNCTION_SCHEMAS)
    original_lifespan = server_module.app.router.lifespan_context

    server_module.FUNCTION_SCHEMAS.clear()
    server_module.FUNCTION_SCHEMAS.append(schema)
    server_module.app.router.lifespan_context = _noop_lifespan
    reset_hook_action_events()

    try:
        with TestClient(server_module.app) as client:
            response = client.post(
                "/api/hook_actions",
                json=[
                    {
                        "action": "delete",
                        "nodeId": "node-old",
                        "callableId": schema.callable_id,
                    },
                    {
                        "action": "add",
                        "nodeId": "node-new",
                        "callableId": schema.callable_id,
                    },
                ],
            )

            assert response.status_code == 200
            assert response.json() == {"status": "success", "processed": 2}
            assert HOOK_ACTION_EVENTS == [
                (
                    "delete",
                    {
                        "action": "delete",
                        "node_id": "node-old",
                        "callable_id": schema.callable_id,
                    },
                ),
                (
                    "add",
                    {
                        "action": "add",
                        "node_id": "node-new",
                        "callable_id": schema.callable_id,
                    },
                ),
            ]
    finally:
        server_module.FUNCTION_SCHEMAS.clear()
        server_module.FUNCTION_SCHEMAS.extend(original_function_schemas)
        server_module.app.router.lifespan_context = original_lifespan


def test_hook_actions_route_returns_404_for_unknown_callable():
    original_function_schemas = list(server_module.FUNCTION_SCHEMAS)
    original_lifespan = server_module.app.router.lifespan_context

    server_module.FUNCTION_SCHEMAS.clear()
    server_module.app.router.lifespan_context = _noop_lifespan

    try:
        with TestClient(server_module.app) as client:
            response = client.post(
                "/api/hook_actions",
                json=[
                    {
                        "action": "add",
                        "nodeId": "node-missing",
                        "callableId": "missing-callable",
                    }
                ],
            )

            assert response.status_code == 404
            assert response.json() == {
                "detail": "Unknown callable_id: missing-callable"
            }
    finally:
        server_module.FUNCTION_SCHEMAS.clear()
        server_module.FUNCTION_SCHEMAS.extend(original_function_schemas)
        server_module.app.router.lifespan_context = original_lifespan
