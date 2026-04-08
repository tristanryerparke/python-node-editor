from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.schema import Graph
from tests.assets.graph_utils import node_from_schema
from tests.assets.hooks import (
    HOOK_EVENTS,
    add_with_hooked_options,
    add_with_silent_pre_hook,
    multiply_with_hooked_options,
    reset_hook_events,
)

_, schema_add, _, types_add = analyze_function(add_with_hooked_options)
_, schema_multiply, _, types_multiply = analyze_function(multiply_with_hooked_options)
_, schema_silent_pre, _, types_silent_pre = analyze_function(add_with_silent_pre_hook)

server_module.CALLABLES[schema_add.callable_id] = add_with_hooked_options
server_module.CALLABLES[schema_multiply.callable_id] = multiply_with_hooked_options
server_module.CALLABLES[schema_silent_pre.callable_id] = add_with_silent_pre_hook
server_module.FUNCTION_SCHEMAS.append(schema_add)
server_module.FUNCTION_SCHEMAS.append(schema_multiply)
server_module.FUNCTION_SCHEMAS.append(schema_silent_pre)
server_module.TYPES.update(types_add)
server_module.TYPES.update(types_multiply)
server_module.TYPES.update(types_silent_pre)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Hooks Python Node Editor", lifespan=lifespan)
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


def test_hooks_receive_subset_arguments_for_single_node_execution():
    reset_hook_events()

    node = node_from_schema("node1", schema_add)
    node.data.arguments["a"].value = 5
    node.data.arguments["b"].value = 3

    graph = Graph(nodes=[node], edges=[])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][0]["outputs"]["sum"]["value"] == 8

    assert len(HOOK_EVENTS) == 2

    pre_event_name, pre_payload = HOOK_EVENTS[0]
    assert pre_event_name == "pre_inputs_only"
    assert pre_payload["inputs"] == {"a": 5, "b": 3}

    post_event_name, post_payload = HOOK_EVENTS[1]
    assert post_event_name == "post_full_context"
    assert post_payload["inputs"] == {"a": 5, "b": 3}
    assert post_payload["output"] == 8
    assert isinstance(post_payload["execution_id"], str)
    assert post_payload["execution_id"] != ""
    assert post_payload["node_id"] == "node1"


def test_hooks_and_add_node_options_work_with_reversed_decorator_order():
    reset_hook_events()

    node = node_from_schema("node2", schema_multiply)
    node.data.arguments["a"].value = 4
    node.data.arguments["b"].value = 6

    graph = Graph(nodes=[node], edges=[])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][0]["outputs"]["product"]["value"] == 24

    assert len(HOOK_EVENTS) == 2

    pre_event_name, pre_payload = HOOK_EVENTS[0]
    assert pre_event_name == "pre_full_context"
    assert pre_payload["inputs"] == {"a": 4, "b": 6}
    assert isinstance(pre_payload["execution_id"], str)
    assert pre_payload["execution_id"] != ""
    assert pre_payload["node_id"] == "node2"

    post_event_name, post_payload = HOOK_EVENTS[1]
    assert post_event_name == "post_inputs_output"
    assert post_payload["inputs"] == {"a": 4, "b": 6}
    assert post_payload["output"] == 24


def test_pre_hook_output_can_be_omitted_from_terminal_output():
    reset_hook_events()

    node = node_from_schema("node3", schema_silent_pre)
    node.data.arguments["a"].value = 2
    node.data.arguments["b"].value = 3

    graph = Graph(nodes=[node], edges=[])

    response = client.post("/api/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert result["updates"][0]["outputs"]["sum"]["value"] == 5
    assert result["updates"][0]["terminalOutput"] == "FUNCTION OUTPUT\n"

    assert len(HOOK_EVENTS) == 1
    pre_event_name, pre_payload = HOOK_EVENTS[0]
    assert pre_event_name == "pre_inputs_only_no_terminal_output"
    assert pre_payload["inputs"] == {"a": 2, "b": 3}
