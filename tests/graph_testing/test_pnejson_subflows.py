import json
from pathlib import Path

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.analysis.utils import analyze_file_structure
from python_node_editor.execution.exec_sync import execute_graph_to_updates
from python_node_editor.schema import Edge, Graph
from tests.assets.functions import add, multiply
from tests.assets.graph_utils import node_from_schema


_, SCHEMA_ADD, _, _ = analyze_function(add)
_, SCHEMA_MULTIPLY, _, _ = analyze_function(multiply)
FUNCTIONS_PATH = Path(__file__).parents[1] / "assets" / "functions.py"


def _node_payload(node):
    return node.model_dump(by_alias=True, mode="json")


def _write_subflow(path: Path, *, include_output: bool = True, missing_callable: bool = False):
    add_node = node_from_schema("add1", SCHEMA_ADD, position={"x": 0, "y": 0})
    multiply_node = node_from_schema(
        "multiply1", SCHEMA_MULTIPLY, position={"x": 200, "y": 0}
    )
    if missing_callable:
        add_node.data.callable_id = "missing-callable"

    flow = {
        "name": "math_subflow",
        "nodes": [_node_payload(add_node), _node_payload(multiply_node)],
        "edges": [
            Edge(
                id="edge1",
                source="add1",
                source_handle="add1:outputs:return:handle",
                target="multiply1",
                target_handle="multiply1:arguments:a:handle",
            ).model_dump(by_alias=True, mode="json")
        ],
        "viewport": {"x": 0, "y": 0, "zoom": 1},
        "functionSchemas": [
            SCHEMA_ADD.model_dump(by_alias=True, mode="json"),
            SCHEMA_MULTIPLY.model_dump(by_alias=True, mode="json"),
        ],
        "types": {},
        "inspector": {
            "entries": [
                {
                    "id": "input-a",
                    "isExpanded": True,
                    "customName": "a",
                    "selectedTarget": {
                        "nodeId": "add1",
                        "path": ["add1", "arguments", "a"],
                    },
                    "viewMode": "json",
                },
                {
                    "id": "input-b",
                    "isExpanded": True,
                    "customName": "b",
                    "selectedTarget": {
                        "nodeId": "add1",
                        "path": ["add1", "arguments", "b"],
                    },
                    "viewMode": "json",
                },
                {
                    "id": "input-factor",
                    "isExpanded": True,
                    "customName": "factor",
                    "selectedTarget": {
                        "nodeId": "multiply1",
                        "path": ["multiply1", "arguments", "b"],
                    },
                    "viewMode": "json",
                },
            ],
            "showBorders": True,
        },
    }

    if include_output:
        flow["inspector"]["entries"].append(
            {
                "id": "output-result",
                "isExpanded": True,
                "customName": "result",
                "selectedTarget": {
                    "nodeId": "multiply1",
                    "path": ["multiply1", "outputs", "return"],
                },
                "viewMode": "json",
            }
        )

    path.write_text(json.dumps(flow), encoding="utf-8")
    return flow


def test_pnejson_subflow_registers_from_inspector_interface(tmp_path):
    subflow_path = tmp_path / "math_subflow.pnejson"
    _write_subflow(subflow_path)

    schemas, callables, types = analyze_file_structure(
        [str(FUNCTIONS_PATH), str(subflow_path)]
    )

    subflow_schema = next(schema for schema in schemas if schema.name == "math_subflow")
    assert subflow_schema.callable_id.startswith("subflow:")
    assert set(subflow_schema.arguments) == {"a", "b", "factor"}
    assert set(subflow_schema.outputs) == {"result"}
    assert subflow_schema.output_style == "single"
    assert subflow_schema.callable_id in callables
    assert isinstance(types, dict)


def test_pnejson_subflow_executes_inside_outer_graph(tmp_path, monkeypatch):
    subflow_path = tmp_path / "math_subflow.pnejson"
    _write_subflow(subflow_path)

    schemas, callables, types = analyze_file_structure(
        [str(FUNCTIONS_PATH), str(subflow_path)]
    )
    monkeypatch.setattr(server_module, "CALLABLES", dict(callables))
    monkeypatch.setattr(server_module, "TYPES", dict(types))

    subflow_schema = next(schema for schema in schemas if schema.name == "math_subflow")
    subflow_node = node_from_schema("subflow1", subflow_schema)
    subflow_node.data.arguments["a"].value = 5
    subflow_node.data.arguments["b"].value = 3
    subflow_node.data.arguments["factor"].value = 2

    updates = execute_graph_to_updates(Graph(nodes=[subflow_node], edges=[]))

    assert len(updates) == 1
    assert updates[0].status == "executed"
    assert updates[0].outputs["result"].value == 16


def test_pnejson_flow_without_input_and_output_interface_is_not_registered(tmp_path):
    subflow_path = tmp_path / "not_a_subflow.pnejson"
    _write_subflow(subflow_path, include_output=False)

    schemas, callables, _ = analyze_file_structure([str(FUNCTIONS_PATH), str(subflow_path)])

    assert all(schema.name != "math_subflow" for schema in schemas)
    assert all(not callable_id.startswith("subflow:") for callable_id in callables)


def test_pnejson_subflow_with_missing_callable_is_not_registered(tmp_path):
    subflow_path = tmp_path / "missing_callable_subflow.pnejson"
    _write_subflow(subflow_path, missing_callable=True)

    schemas, callables, _ = analyze_file_structure([str(subflow_path)])

    assert schemas == []
    assert callables == {}
