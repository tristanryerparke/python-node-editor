from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.schema import DataWrapper, Edge, Graph
from tests.assets.dynamic_inputs import (
    create_dict_of_floats,
    create_list_of_floats,
    index_dict_of_floats,
    index_list_of_floats,
)
from tests.assets.graph_utils import node_from_schema

# Analyze the functions to get types and schemas
_, list_schema, _, list_types = analyze_function(create_list_of_floats)
_, dict_schema, _, dict_types = analyze_function(create_dict_of_floats)
_, index_list_schema, _, _ = analyze_function(index_list_of_floats)
_, index_dict_schema, _, _ = analyze_function(index_dict_of_floats)

# Register the functions and their types
mock_callables = {
    list_schema.callable_id: create_list_of_floats,
    dict_schema.callable_id: create_dict_of_floats,
    index_list_schema.callable_id: index_list_of_floats,
    index_dict_schema.callable_id: index_dict_of_floats,
}

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(list_types)
server_module.TYPES.update(dict_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Dynamic Inputs", lifespan=lifespan)
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


def test_create_dict_of_floats():
    """Test executing a single create_dict_of_floats node with dict_inputs"""
    node1 = node_from_schema("dict-node-1", dict_schema)
    node1.data.arguments["key_0"] = DataWrapper(type="float", value=2.5)
    node1.data.arguments["key_1"] = DataWrapper(type="float", value=3.7)
    node1.data.arguments["temperature"] = DataWrapper(type="float", value=98.6)

    graph = Graph(nodes=[node1], edges=[])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node_update = result["updates"][0]
    assert node_update["nodeId"] == "dict-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"]["structureType"] == "dict"
    assert output["type"]["itemsType"] == "float"
    assert output["value"] == {
        "key_0": 2.5,
        "key_1": 3.7,
        "temperature": 98.6,
    }


def test_create_list_of_floats():
    """Test executing a single create_list_of_floats node with list_inputs"""
    node1 = node_from_schema("list-node-1", list_schema)
    node1.data.arguments["0"] = DataWrapper(type="float", value=1.1)
    node1.data.arguments["1"] = DataWrapper(type="float", value=2.2)
    node1.data.arguments["2"] = DataWrapper(type="float", value=3.3)

    graph = Graph(nodes=[node1], edges=[])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    node_update = result["updates"][0]
    assert node_update["nodeId"] == "list-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"]["structureType"] == "list"
    assert output["type"]["itemsType"] == "float"
    assert output["value"] == [1.1, 2.2, 3.3]


def test_create_and_index_dict():
    """Test creating a dict and then indexing into it"""
    node1 = node_from_schema("create-dict", dict_schema)
    node1.data.arguments["alpha"] = DataWrapper(type="float", value=1.0)
    node1.data.arguments["beta"] = DataWrapper(type="float", value=2.0)
    node1.data.arguments["gamma"] = DataWrapper(type="float", value=3.0)

    node2 = node_from_schema(
        "index-dict", index_dict_schema, position={"x": 200, "y": 0}
    )
    node2.data.arguments["dict"].value = None
    node2.data.arguments["key"].value = "beta"

    edge1 = Edge(
        id="edge1",
        source="create-dict",
        source_handle="create-dict:outputs:return:handle",
        target="index-dict",
        target_handle="index-dict:inputs:dict:handle",
    )

    graph = Graph(nodes=[node1, node2], edges=[edge1])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: create dict, downstream arg update, index dict
    assert len(result["updates"]) == 3

    # Verify create dict node output
    create_update = result["updates"][0]
    assert create_update["nodeId"] == "create-dict"
    assert create_update["outputs"]["return"]["value"] == {
        "alpha": 1.0,
        "beta": 2.0,
        "gamma": 3.0,
    }

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "index-dict"
    assert downstream_update["arguments"]["dict"]["value"] == {
        "alpha": 1.0,
        "beta": 2.0,
        "gamma": 3.0,
    }

    # Verify index dict node output
    index_update = result["updates"][2]
    assert index_update["nodeId"] == "index-dict"
    assert index_update["outputs"]["return"]["value"] == 2.0


def test_create_and_index_list():
    """Test creating a list and then indexing into it"""
    graph_data = {
        "nodes": [
            {
                "id": "create-list",
                "position": {"x": 0, "y": 0},
                "data": {
                    "callableId": list_schema.callable_id,
                    "arguments": {
                        "0": {"type": "float", "value": 10.0},
                        "1": {"type": "float", "value": 20.0},
                        "2": {"type": "float", "value": 30.0},
                    },
                    "outputs": {
                        "return": {
                            "type": {
                                "structureType": "list",
                                "itemsType": "float",
                            }
                        }
                    },
                    "outputStyle": "single",
                },
            },
            {
                "id": "index-list",
                "position": {"x": 200, "y": 0},
                "data": {
                    "callableId": index_list_schema.callable_id,
                    "arguments": {
                        "the_list": {
                            "type": {
                                "structureType": "list",
                                "itemsType": "float",
                            },
                            "value": None,
                        },
                        "index": {"type": "int", "value": 1},
                    },
                    "outputs": {"return": {"type": "float"}},
                    "outputStyle": "single",
                },
            },
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "create-list",
                "sourceHandle": "create-list:outputs:return:handle",
                "target": "index-list",
                "targetHandle": "index-list:inputs:the_list:handle",
            }
        ],
    }

    response = client.post("/api/graph_execute", json=graph_data)
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: create list, downstream arg update, index list
    assert len(result["updates"]) == 3

    # Verify create list node output
    create_update = result["updates"][0]
    assert create_update["nodeId"] == "create-list"
    assert create_update["outputs"]["return"]["value"] == [10.0, 20.0, 30.0]

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "index-list"
    assert downstream_update["arguments"]["the_list"]["value"] == [10.0, 20.0, 30.0]

    # Verify index list node output
    index_update = result["updates"][2]
    assert index_update["nodeId"] == "index-list"
    assert index_update["outputs"]["return"]["value"] == 20.0
