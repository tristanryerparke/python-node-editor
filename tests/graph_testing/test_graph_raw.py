from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.execution.exec_sync import router as graph_router
from tests.assets.functions import add, multiply

# Analyze the test functions and register them
_, schema_add, _, types_add = analyze_function(add)
_, schema_multiply, _, types_multiply = analyze_function(multiply)

server_module.CALLABLES[schema_add.callable_id] = add
server_module.CALLABLES[schema_multiply.callable_id] = multiply
server_module.FUNCTION_SCHEMAS.append(schema_add)
server_module.FUNCTION_SCHEMAS.append(schema_multiply)
server_module.TYPES.update(types_add)
server_module.TYPES.update(types_multiply)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Raw Graph", lifespan=lifespan)
app.include_router(graph_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

client = TestClient(app)


def test_single_node_execute_raw():
    """Make sure the app can execute a single node with raw graph payloads."""
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": schema_add.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [],
    }

    response = client.post("/api/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8


def test_two_nodes_execute_raw():
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": schema_add.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "node2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": schema_multiply.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": 4},
                        "b": {"type": "int", "value": 2},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [],
    }

    response = client.post("/api/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 2

    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8

    node2_update = result["updates"][1]
    assert node2_update["nodeId"] == "node2"
    assert node2_update["outputs"]["return"]["value"] == 8


def test_two_connected_nodes_execute_raw():
    graph_data = {
        "nodes": [
            {
                "id": "node1",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": schema_add.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": 5},
                        "b": {"type": "int", "value": 3},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
            {
                "id": "node2",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": schema_multiply.callable_id,
                    "arguments": {
                        "a": {"type": "int", "value": None},
                        "b": {"type": "int", "value": 2},
                    },
                    "outputs": {"return": {"type": "int"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "node1",
                "sourceHandle": "node1:outputs:return:handle",
                "target": "node2",
                "targetHandle": "node2:inputs:a:handle",
            }
        ],
    }

    response = client.post("/api/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 3

    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8

    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "node2"
    assert downstream_update["arguments"]["a"]["value"] == 8

    node2_update = result["updates"][2]
    assert node2_update["nodeId"] == "node2"
    assert node2_update["outputs"]["return"]["value"] == 16
