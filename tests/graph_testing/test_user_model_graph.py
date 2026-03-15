from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from examples.user_model import Point2D, two_point_distance
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.analysis.user_model_functions.user_model_nodes import (
    create_const_deconst_models,
)
from python_node_editor.display import add_model_options
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.schema import Edge, Graph
from python_node_editor.schema_base import UserModel
from tests.assets.graph_utils import node_from_schema


def translate_up(point: Point2D, distance: float) -> Point2D:
    return Point2D(x=point.x, y=point.y + distance)


HOOK_RESULTS = []


def store_construct_result(result, node_id=None):
    HOOK_RESULTS.append(("construct", result.x, result.y, node_id))


def store_deconstruct_result(result, node_id=None):
    HOOK_RESULTS.append(("deconstruct", result.x, result.y, node_id))


@add_model_options(
    construct_post_hook=store_construct_result,
    deconstruct_post_hook=store_deconstruct_result,
)
class HookedPoint(UserModel):
    x: float
    y: float


def translate_hooked_point(point: HookedPoint, distance: float) -> HookedPoint:
    return HookedPoint(x=point.x, y=point.y + distance)


# Analyze the function to get types and schema
_, schema, _, found_types = analyze_function(two_point_distance)
_, translate_schema, _, translate_found_types = analyze_function(translate_up)
_, _, _, hooked_found_types = analyze_function(translate_hooked_point)

# Register the function and its types
mock_callables = {
    schema.callable_id: two_point_distance,
    translate_schema.callable_id: translate_up,
}

# Create construct/deconstruct nodes for user models
model_schemas, model_callables = create_const_deconst_models(found_types)
hooked_model_schemas, hooked_model_callables = create_const_deconst_models(
    hooked_found_types
)

# Get the callable IDs from the schemas
construct_callable_id = None
deconstruct_callable_id = None
for model_schema in model_schemas:
    if model_schema.name.startswith("construct-"):
        construct_callable_id = model_schema.callable_id
    elif model_schema.name.startswith("deconstruct-"):
        deconstruct_callable_id = model_schema.callable_id

construct_schema = next(
    schema_item
    for schema_item in model_schemas
    if schema_item.callable_id == construct_callable_id
)
deconstruct_schema = next(
    schema_item
    for schema_item in model_schemas
    if schema_item.callable_id == deconstruct_callable_id
)

hooked_construct_schema = next(
    schema_item
    for schema_item in hooked_model_schemas
    if schema_item.name.startswith("construct-")
)
hooked_deconstruct_schema = next(
    schema_item
    for schema_item in hooked_model_schemas
    if schema_item.name.startswith("deconstruct-")
)

mock_callables.update(model_callables)
mock_callables.update(hooked_model_callables)

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(found_types)
server_module.TYPES.update(translate_found_types)
server_module.TYPES.update(hooked_found_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - User Model Graph", lifespan=lifespan)
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


def test_single_construct_node():
    """Test executing a single Point2D construct node"""
    node1 = node_from_schema("construct-node-1", construct_schema)
    node1.data.arguments["x"].value = 2.0
    node1.data.arguments["y"].value = 4.0

    graph = Graph(nodes=[node1], edges=[])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node_update = result["updates"][0]
    assert node_update["nodeId"] == "construct-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"] == "Point2D"
    assert output["value"] == {"x": 2.0, "y": 4.0}


def test_construct_and_deconstruct():
    """Test constructing a Point2D and then deconstructing it"""
    construct_node = node_from_schema("construct-node-1", construct_schema)
    construct_node.data.arguments["x"].value = 3.0
    construct_node.data.arguments["y"].value = 5.0

    deconstruct_node = node_from_schema(
        "deconstruct-node-1", deconstruct_schema, position={"x": 200, "y": 0}
    )
    deconstruct_node.data.arguments["instance"].value = None

    edge1 = Edge(
        id="edge1",
        source="construct-node-1",
        source_handle="construct-node-1:outputs:return:handle",
        target="deconstruct-node-1",
        target_handle="deconstruct-node-1:inputs:instance:handle",
    )

    graph = Graph(nodes=[construct_node, deconstruct_node], edges=[edge1])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: construct, downstream arg update, deconstruct
    assert len(result["updates"]) == 3

    # Verify construct node output
    construct_update = result["updates"][0]
    assert construct_update["nodeId"] == "construct-node-1"
    assert construct_update["outputs"]["return"]["value"] == {"x": 3.0, "y": 5.0}

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "deconstruct-node-1"
    assert downstream_update["arguments"]["instance"]["value"] == {"x": 3.0, "y": 5.0}

    # Verify deconstruct node outputs
    deconstruct_update = result["updates"][2]
    assert deconstruct_update["nodeId"] == "deconstruct-node-1"
    assert deconstruct_update["outputs"]["x"]["value"] == 3.0
    assert deconstruct_update["outputs"]["y"]["value"] == 5.0


def test_two_point_distance_calculation():
    """Test calculating distance between two points"""
    point_a = node_from_schema("construct-point-a", construct_schema)
    point_a.data.arguments["x"].value = 0.0
    point_a.data.arguments["y"].value = 0.0

    point_b = node_from_schema(
        "construct-point-b", construct_schema, position={"x": 0, "y": 100}
    )
    point_b.data.arguments["x"].value = 3.0
    point_b.data.arguments["y"].value = 4.0

    distance_node = node_from_schema(
        "distance-node", schema, position={"x": 200, "y": 50}
    )
    distance_node.data.arguments["a"].value = None
    distance_node.data.arguments["b"].value = None

    edge1 = Edge(
        id="edge1",
        source="construct-point-a",
        source_handle="construct-point-a:outputs:return:handle",
        target="distance-node",
        target_handle="distance-node:inputs:a:handle",
    )
    edge2 = Edge(
        id="edge2",
        source="construct-point-b",
        source_handle="construct-point-b:outputs:return:handle",
        target="distance-node",
        target_handle="distance-node:inputs:b:handle",
    )

    graph = Graph(nodes=[point_a, point_b, distance_node], edges=[edge1, edge2])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 5 updates: construct-a, construct-b, 2 downstream arg updates, distance
    assert len(result["updates"]) == 5

    # Verify the sequence of updates
    assert result["updates"][0]["nodeId"] == "construct-point-a"
    assert "outputs" in result["updates"][0]

    assert result["updates"][1]["nodeId"] == "distance-node"
    assert "arguments" in result["updates"][1]

    assert result["updates"][2]["nodeId"] == "construct-point-b"
    assert "outputs" in result["updates"][2]

    assert result["updates"][3]["nodeId"] == "distance-node"
    assert "arguments" in result["updates"][3]

    # Verify distance calculation (distance from (0,0) to (3,4) should be 5.0)
    distance_update = result["updates"][4]
    assert distance_update["nodeId"] == "distance-node"
    assert distance_update["outputs"]["return"]["value"] == 5.0


def test_user_model_return_node_executes_as_single_output():
    construct_node = node_from_schema("construct-node-1", construct_schema)
    construct_node.data.arguments["x"].value = 2.0
    construct_node.data.arguments["y"].value = 2.0

    translate_node = node_from_schema(
        "translate-node-1", translate_schema, position={"x": 200, "y": 0}
    )
    translate_node.data.arguments["point"].value = None
    translate_node.data.arguments["distance"].value = 5.0

    edge1 = Edge(
        id="edge1",
        source="construct-node-1",
        source_handle="construct-node-1:outputs:return:handle",
        target="translate-node-1",
        target_handle="translate-node-1:inputs:point:handle",
    )

    graph = Graph(nodes=[construct_node, translate_node], edges=[edge1])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 3

    translate_update = result["updates"][2]
    assert translate_update["nodeId"] == "translate-node-1"
    assert translate_update["outputs"]["return"]["type"] == "Point2D"
    assert translate_update["outputs"]["return"]["value"] == {"x": 2.0, "y": 7.0}


def test_construct_post_hook_runs_for_generated_model_node():
    HOOK_RESULTS.clear()

    construct_node = node_from_schema("construct-hooked-1", hooked_construct_schema)
    construct_node.data.arguments["x"].value = 2.0
    construct_node.data.arguments["y"].value = 4.0

    graph = Graph(nodes=[construct_node], edges=[])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][0]["outputs"]["return"]["value"] == {"x": 2.0, "y": 4.0}
    assert HOOK_RESULTS == [("construct", 2.0, 4.0, "construct-hooked-1")]


def test_deconstruct_post_hook_runs_for_generated_model_node():
    HOOK_RESULTS.clear()

    construct_node = node_from_schema("construct-hooked-1", hooked_construct_schema)
    construct_node.data.arguments["x"].value = 3.0
    construct_node.data.arguments["y"].value = 5.0

    deconstruct_node = node_from_schema(
        "deconstruct-hooked-1",
        hooked_deconstruct_schema,
        position={"x": 200, "y": 0},
    )
    deconstruct_node.data.arguments["instance"].value = None

    edge1 = Edge(
        id="edge1",
        source="construct-hooked-1",
        source_handle="construct-hooked-1:outputs:return:handle",
        target="deconstruct-hooked-1",
        target_handle="deconstruct-hooked-1:inputs:instance:handle",
    )

    graph = Graph(nodes=[construct_node, deconstruct_node], edges=[edge1])

    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][2]["outputs"]["x"]["value"] == 3.0
    assert result["updates"][2]["outputs"]["y"]["value"] == 5.0
    assert HOOK_RESULTS == [
        ("construct", 3.0, 5.0, "construct-hooked-1"),
        ("deconstruct", 3.0, 5.0, "deconstruct-hooked-1"),
    ]
