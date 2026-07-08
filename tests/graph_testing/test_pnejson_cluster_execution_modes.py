import asyncio
import json
import time
from pathlib import Path

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import ASGITransport

import python_node_editor.server as server_module
from python_node_editor.analysis.utils import analyze_file_structure
from python_node_editor.execution.exec_async import EXECUTIONS, router as async_router
from python_node_editor.execution.exec_sync import router as sync_router
from python_node_editor.schema import Graph
from tests.assets.graph_utils import node_from_schema


def _write_mode_function(path: Path) -> None:
    path.write_text(
        "import time\n"
        "from python_node_editor.display import flush_output_to_frontend\n"
        "from python_node_editor.execution.context import execution_mode_context\n"
        "\n"
        "def report_mode(label: str) -> str:\n"
        "    mode = execution_mode_context.get()\n"
        "    flush_output_to_frontend(f'mode:{mode}')\n"
        "    time.sleep(0.05)\n"
        "    return mode\n",
        encoding="utf-8",
    )


def _node_payload(node):
    return node.model_dump(by_alias=True, mode="json")


def _write_mode_cluster(path: Path, schema) -> None:
    node = node_from_schema("mode1", schema, position={"x": 0, "y": 0})
    flow = {
        "name": "mode_cluster",
        "nodes": [_node_payload(node)],
        "edges": [],
        "viewport": {"x": 0, "y": 0, "zoom": 1},
        "functionSchemas": [schema.model_dump(by_alias=True, mode="json")],
        "types": {},
        "inspector": {
            "entries": [
                {
                    "id": "input-label",
                    "isExpanded": True,
                    "customName": "label",
                    "selectedTarget": {
                        "nodeId": "mode1",
                        "path": ["mode1", "arguments", "label"],
                    },
                    "viewMode": "json",
                },
                {
                    "id": "output-mode",
                    "isExpanded": True,
                    "customName": "mode",
                    "selectedTarget": {
                        "nodeId": "mode1",
                        "path": ["mode1", "outputs", "return"],
                    },
                    "viewMode": "json",
                },
            ],
            "showBorders": True,
        },
    }
    path.write_text(json.dumps(flow), encoding="utf-8")


def _build_mode_cluster(tmp_path: Path):
    functions_path = tmp_path / "mode_nodes.py"
    cluster_path = tmp_path / "mode_cluster.pnejson"
    _write_mode_function(functions_path)

    function_schemas, _, _ = analyze_file_structure(str(functions_path))
    function_schema = next(schema for schema in function_schemas if schema.name == "report_mode")
    _write_mode_cluster(cluster_path, function_schema)

    schemas, callables, types = analyze_file_structure(
        [str(functions_path), str(cluster_path)]
    )
    cluster_schema = next(schema for schema in schemas if schema.name == "mode_cluster")
    cluster_node = node_from_schema("cluster1", cluster_schema)
    cluster_node.data.arguments["label"].value = "hello"
    graph = Graph(nodes=[cluster_node], edges=[])
    return graph, callables, types


async def _poll_until_complete(client: httpx.AsyncClient, execution_id: str):
    snapshots = []
    last_index = None
    start = time.time()
    while time.time() - start < 5:
        response = await client.get(f"/api/execution_update/{execution_id}")
        assert response.status_code == 200
        snapshot = response.json()
        if snapshot.get("updateIndex") != last_index:
            snapshots.append(snapshot)
            last_index = snapshot.get("updateIndex")
        if snapshot.get("status") == "complete":
            return snapshots
        await asyncio.sleep(0.01)
    raise TimeoutError("execution did not complete")


def test_cluster_internals_use_sync_mode_on_sync_route(tmp_path, monkeypatch):
    graph, callables, types = _build_mode_cluster(tmp_path)
    monkeypatch.setattr(server_module, "CALLABLES", dict(callables))
    monkeypatch.setattr(server_module, "TYPES", dict(types))

    app = FastAPI(title="sync cluster mode test")
    app.include_router(sync_router)
    client = TestClient(app)

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))

    assert response.status_code == 200
    update = response.json()["updates"][0]
    assert update["outputs"]["mode"]["value"] == "sync"
    assert "mode:sync" in update["terminalOutput"]


@pytest.mark.asyncio
async def test_cluster_internals_use_async_mode_on_async_route(tmp_path, monkeypatch):
    graph, callables, types = _build_mode_cluster(tmp_path)
    monkeypatch.setattr(server_module, "CALLABLES", dict(callables))
    monkeypatch.setattr(server_module, "TYPES", dict(types))
    EXECUTIONS.clear()

    app = FastAPI(title="async cluster mode test")
    app.include_router(async_router)

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/execution_submit", json=graph.model_dump(by_alias=True)
        )
        assert response.status_code == 200
        snapshots = await _poll_until_complete(client, response.json()["execution_id"])

    final_update = snapshots[-1]["nodeUpdates"]["cluster1"]
    assert final_update["outputs"]["mode"]["value"] == "async"
    assert "mode:async" in final_update["terminalOutput"]

    terminal_snapshots = [
        snapshot.get("nodeUpdates", {}).get("cluster1", {}).get("terminalOutput", "")
        for snapshot in snapshots
    ]
    assert any("mode:async" in terminal for terminal in terminal_snapshots[:-1])
