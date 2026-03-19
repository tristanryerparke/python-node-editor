from contextlib import asynccontextmanager

from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from tests.assets.functions import add


@asynccontextmanager
async def _noop_lifespan(app):
    yield


def test_environment_route_returns_nodes_and_types():
    _, schema, _, found_types = analyze_function(add)

    original_function_schemas = list(server_module.FUNCTION_SCHEMAS)
    original_types = dict(server_module.TYPES)
    original_lifespan = server_module.app.router.lifespan_context

    server_module.FUNCTION_SCHEMAS.clear()
    server_module.FUNCTION_SCHEMAS.append(schema)
    server_module.TYPES.clear()
    server_module.TYPES.update(found_types)
    server_module.app.router.lifespan_context = _noop_lifespan

    try:
        with TestClient(server_module.app) as client:
            health_response = client.get("/api/health")
            assert health_response.status_code == 200
            assert health_response.json() == {"status": "ok"}

            environment_response = client.get("/api/environment")
            assert environment_response.status_code == 200
            assert environment_response.json() == {
                "nodes": [
                    schema.model_dump(
                        mode="json",
                        exclude_defaults=True,
                        exclude_none=True,
                    )
                ],
                "types": {
                    key: value.model_dump(mode="json")
                    for key, value in found_types.items()
                },
            }

            assert client.get("/nodes").status_code == 404
            assert client.get("/types").status_code == 404
    finally:
        server_module.FUNCTION_SCHEMAS.clear()
        server_module.FUNCTION_SCHEMAS.extend(original_function_schemas)
        server_module.TYPES.clear()
        server_module.TYPES.update(original_types)
        server_module.app.router.lifespan_context = original_lifespan
