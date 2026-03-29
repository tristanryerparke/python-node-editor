from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.analysis.user_model_functions.user_model_nodes import (
    create_const_deconst_models,
)
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.large_data.large_files_endpoint import router as data_router
from python_node_editor.schema import Graph
from tests.assets.graph_utils import node_from_schema
from tests.assets.point2d_from_backend import passthrough_point

_, schema, _, found_types = analyze_function(passthrough_point)

model_schemas, model_callables = create_const_deconst_models(found_types)

deconstruct_schema = next(
    schema_item
    for schema_item in model_schemas
    if schema_item.name == "deconstruct-Point2DFromBackend"
)

server_module.CALLABLES[schema.callable_id] = passthrough_point
server_module.CALLABLES.update(model_callables)
server_module.FUNCTION_SCHEMAS.append(schema)
server_module.FUNCTION_SCHEMAS.extend(model_schemas)
server_module.TYPES.update(found_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Retrieve Route", lifespan=lifespan)
app.include_router(graph_router)
app.include_router(data_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

client = TestClient(app)


def test_retrieve_route_returns_payload_from_type_retriever():
    response = client.post(
        "/api/data/retrieve",
        json={"type": "Point2DFromBackend"},
    )

    assert response.status_code == 200
    assert response.json() == {"x": 5, "y": 100}


def test_retrieve_route_errors_for_unknown_type():
    response = client.post(
        "/api/data/retrieve",
        json={"type": "MissingType"},
    )

    assert response.status_code == 400
    assert "Unknown type" in response.json()["detail"]


def test_retrieved_payload_can_be_deconstructed():
    retrieve_response = client.post(
        "/api/data/retrieve",
        json={"type": "Point2DFromBackend"},
    )
    assert retrieve_response.status_code == 200

    deconstruct_node = node_from_schema("deconstruct-node-1", deconstruct_schema)
    deconstruct_node.data.arguments["instance"].value = retrieve_response.json()

    graph = Graph(nodes=[deconstruct_node], edges=[])

    execute_response = client.post(
        "/api/graph_execute",
        json=graph.model_dump(by_alias=True),
    )
    assert execute_response.status_code == 200

    result = execute_response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    update = result["updates"][0]
    assert update["nodeId"] == "deconstruct-node-1"
    assert update["outputs"]["x"]["value"] == 5
    assert update["outputs"]["y"]["value"] == 100
