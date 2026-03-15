from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.display import add_node_options
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.schema import Edge, Graph
from tests.assets.functions import add, multiply
from tests.assets.graph_utils import node_from_schema


POST_HOOK_RESULTS = []


def store_post_hook_result(result, node_id=None):
    POST_HOOK_RESULTS.append((result, node_id))


@add_node_options(post_hook=store_post_hook_result)
def add_with_post_hook(a: int, b: int) -> int:
    return a + b


# Analyze the test functions and register them
_, schema_add, _, types_add = analyze_function(add)
_, schema_multiply, _, types_multiply = analyze_function(multiply)
_, schema_post_hook, _, types_post_hook = analyze_function(add_with_post_hook)

server_module.CALLABLES[schema_add.callable_id] = add
server_module.CALLABLES[schema_multiply.callable_id] = multiply
server_module.CALLABLES[schema_post_hook.callable_id] = add_with_post_hook
server_module.FUNCTION_SCHEMAS.append(schema_add)
server_module.FUNCTION_SCHEMAS.append(schema_multiply)
server_module.FUNCTION_SCHEMAS.append(schema_post_hook)
server_module.TYPES.update(types_add)
server_module.TYPES.update(types_multiply)
server_module.TYPES.update(types_post_hook)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor", lifespan=lifespan)
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


def test_single_node_execute():
    """Make sure the app can execute a single node"""
    # Create node from schema and set argument values via indexing
    node1 = node_from_schema("node1", schema_add)
    node1.data.arguments["a"].value = 5
    node1.data.arguments["b"].value = 3

    # Create Graph instance
    graph = Graph(nodes=[node1], edges=[])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8


def test_two_nodes_execute():
    # Create nodes from schemas and set argument values via indexing
    node1 = node_from_schema("node1", schema_add)
    node1.data.arguments["a"].value = 5
    node1.data.arguments["b"].value = 3

    node2 = node_from_schema("node2", schema_multiply, position={"x": 200, "y": 0})
    node2.data.arguments["a"].value = 4
    node2.data.arguments["b"].value = 2

    # Create Graph instance
    graph = Graph(nodes=[node1, node2], edges=[])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
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


def test_two_connected_nodes_execute():
    # Create nodes from schemas and set argument values via indexing
    node1 = node_from_schema("node1", schema_add)
    node1.data.arguments["a"].value = 5
    node1.data.arguments["b"].value = 3

    # node2's 'a' argument will be populated from node1's output via the edge
    node2 = node_from_schema("node2", schema_multiply, position={"x": 200, "y": 0})
    node2.data.arguments["a"].value = None
    node2.data.arguments["b"].value = 2

    # Create Edge instance
    edge1 = Edge(
        id="edge1",
        source="node1",
        source_handle="node1:outputs:return:handle",
        target="node2",
        target_handle="node2:inputs:a:handle",
    )

    # Create Graph instance
    graph = Graph(nodes=[node1, node2], edges=[edge1])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: node1 execution, downstream arg update, node2 execution
    assert len(result["updates"]) == 3

    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "node1"
    assert node1_update["outputs"]["return"]["value"] == 8

    # Middle update is the downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "node2"
    assert downstream_update["arguments"]["a"]["value"] == 8

    node2_update = result["updates"][2]
    assert node2_update["nodeId"] == "node2"
    assert node2_update["outputs"]["return"]["value"] == 16


def test_post_hook_runs_during_sync_execution():
    POST_HOOK_RESULTS.clear()

    node1 = node_from_schema("node1", schema_post_hook)
    node1.data.arguments["a"].value = 5
    node1.data.arguments["b"].value = 3

    graph = Graph(nodes=[node1], edges=[])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][0]["outputs"]["return"]["value"] == 8
    assert POST_HOOK_RESULTS == [(8, "node1")]
