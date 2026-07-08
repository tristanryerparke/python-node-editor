from __future__ import annotations

import copy
import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from python_node_editor.schema import DataWrapper, FunctionSchema, Graph


@dataclass(frozen=True)
class ClusterEndpoint:
    public_name: str
    node_id: str
    field_name: str
    wrapper: DataWrapper


@dataclass(frozen=True)
class PendingCluster:
    path: str
    callable_id: str
    name: str
    category: list[str]
    graph_payload: dict[str, Any]
    inputs: list[ClusterEndpoint]
    outputs: list[ClusterEndpoint]
    dependencies: set[str]


def find_pnejson_files(
    target_path: str, ignore_underscore_prefix: bool = True
) -> list[str]:
    """Find .pnejson files to analyze as saved flows / possible clusters."""
    pnejson_files: list[str] = []

    if os.path.isdir(target_path):
        for root, dirs, files in os.walk(target_path):
            if ignore_underscore_prefix:
                dirs[:] = [d for d in dirs if not d.startswith("_")]

            for file in files:
                if not file.endswith(".pnejson"):
                    continue
                if ignore_underscore_prefix and file.startswith("_"):
                    continue
                pnejson_files.append(os.path.join(root, file))
    elif target_path.endswith(".pnejson"):
        pnejson_files = [target_path]

    return pnejson_files


def callable_id_for_pnejson(file_path: str) -> str:
    with open(file_path, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    return f"cluster:{digest[:16]}"


def _load_pnejson(file_path: str) -> dict[str, Any] | None:
    try:
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        print(f"Cluster '{file_path}' could not be loaded: {exc}")
        return None

    if not isinstance(data, dict):
        print(f"Cluster '{file_path}' is not a JSON object")
        return None
    return data


def _node_map(graph_payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    nodes = graph_payload.get("nodes")
    if not isinstance(nodes, list):
        return {}
    return {node.get("id"): node for node in nodes if isinstance(node, dict)}


def _section_and_field(path: Any) -> tuple[str, str] | None:
    if not isinstance(path, list):
        return None

    # Saved inspector paths currently look like [nodeId, "arguments", field]
    # but support ["arguments", field] and older "inputs" spelling too.
    for index, segment in enumerate(path):
        if segment not in ("arguments", "inputs", "outputs"):
            continue
        if index + 1 >= len(path) or not isinstance(path[index + 1], str):
            return None
        section = "arguments" if segment == "inputs" else segment
        return section, path[index + 1]

    return None


def _entry_target(entry: dict[str, Any]) -> tuple[str, str, str] | None:
    selected_target = entry.get("selectedTarget")
    if isinstance(selected_target, dict):
        node_id = selected_target.get("nodeId")
        section_field = _section_and_field(selected_target.get("path"))
        if isinstance(node_id, str) and section_field is not None:
            section, field_name = section_field
            return node_id, section, field_name

    target = entry.get("target")
    if isinstance(target, list) and len(target) >= 3:
        node_id, section, field_name = target[0], target[1], target[2]
        if (
            isinstance(node_id, str)
            and section in ("arguments", "inputs", "outputs")
            and isinstance(field_name, str)
        ):
            return node_id, "arguments" if section == "inputs" else section, field_name

    return None


def _public_name(entry: dict[str, Any], fallback: str) -> str:
    custom_name = entry.get("customName")
    if isinstance(custom_name, str) and custom_name.strip():
        return custom_name.strip()
    name = entry.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return fallback


def _wrapper_for_target(
    nodes_by_id: dict[str, dict[str, Any]], node_id: str, section: str, field_name: str
) -> DataWrapper | None:
    node = nodes_by_id.get(node_id)
    if not node:
        return None
    data = node.get("data")
    if not isinstance(data, dict):
        return None
    fields = data.get(section)
    if not isinstance(fields, dict):
        return None
    wrapper_payload = fields.get(field_name)
    if not isinstance(wrapper_payload, dict):
        return None
    try:
        return DataWrapper.model_validate(wrapper_payload).model_copy(deep=True)
    except Exception:
        return None


def _extract_interface(
    file_path: str, graph_payload: dict[str, Any]
) -> tuple[list[ClusterEndpoint], list[ClusterEndpoint]]:
    inspector = graph_payload.get("inspector")
    entries = inspector.get("entries") if isinstance(inspector, dict) else None
    if not isinstance(entries, list):
        return [], []

    nodes_by_id = _node_map(graph_payload)
    inputs: list[ClusterEndpoint] = []
    outputs: list[ClusterEndpoint] = []

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        target = _entry_target(entry)
        if target is None:
            continue

        node_id, section, field_name = target
        wrapper = _wrapper_for_target(nodes_by_id, node_id, section, field_name)
        if wrapper is None:
            print(
                f"Cluster '{file_path}' inspector target "
                f"{node_id}:{section}:{field_name} does not exist"
            )
            continue

        endpoint = ClusterEndpoint(
            public_name=_public_name(entry, field_name),
            node_id=node_id,
            field_name=field_name,
            wrapper=wrapper,
        )
        if section == "arguments":
            inputs.append(endpoint)
        elif section == "outputs":
            outputs.append(endpoint)

    return inputs, outputs


def _cluster_dependencies(graph_payload: dict[str, Any]) -> set[str]:
    dependencies: set[str] = set()
    for node in graph_payload.get("nodes", []):
        if not isinstance(node, dict):
            continue
        data = node.get("data")
        if not isinstance(data, dict):
            continue
        callable_id = data.get("callableId") or data.get("callable_id")
        if isinstance(callable_id, str):
            dependencies.add(callable_id)
    return dependencies


def load_pending_cluster(file_path: str, base_dir: str) -> PendingCluster | None:
    graph_payload = _load_pnejson(file_path)
    if graph_payload is None:
        return None

    inputs, outputs = _extract_interface(file_path, graph_payload)
    if not inputs or not outputs:
        print(
            f"Flow '{file_path}' has no cluster interface; "
            "at least one inspector input and one inspector output are required"
        )
        return None

    input_names = [endpoint.public_name for endpoint in inputs]
    output_names = [endpoint.public_name for endpoint in outputs]
    if len(input_names) != len(set(input_names)):
        print(f"Cluster '{file_path}' has duplicate public input names")
        return None
    if len(output_names) != len(set(output_names)):
        print(f"Cluster '{file_path}' has duplicate public output names")
        return None

    abs_file_path = os.path.abspath(file_path)

    name = graph_payload.get("name")
    if not isinstance(name, str) or not name.strip():
        name = Path(file_path).stem

    category_root = os.path.splitext(os.path.relpath(abs_file_path, base_dir))[0]
    category = category_root.replace(os.sep, "/").split("/")

    return PendingCluster(
        path=abs_file_path,
        callable_id=callable_id_for_pnejson(file_path),
        name=name,
        category=category,
        graph_payload=graph_payload,
        inputs=inputs,
        outputs=outputs,
        dependencies=_cluster_dependencies(graph_payload),
    )


def _make_cluster_callable(cluster: PendingCluster) -> Callable[..., Any]:
    def execute_cluster(**kwargs: Any) -> Any:
        from python_node_editor.execution.context import (
            execution_mode_context,
            progress_context,
        )
        from python_node_editor.execution.exec_sync import execute_graph_to_updates

        graph = Graph.model_validate(copy.deepcopy(cluster.graph_payload))
        nodes_by_id = {node.id: node for node in graph.nodes}

        for endpoint in cluster.inputs:
            try:
                target_wrapper = nodes_by_id[endpoint.node_id].data.arguments[
                    endpoint.field_name
                ]
            except KeyError as exc:
                raise RuntimeError(
                    f"Cluster input target missing: "
                    f"{endpoint.node_id}.arguments.{endpoint.field_name}"
                ) from exc
            target_wrapper.value = kwargs.get(endpoint.public_name)

        execution_mode = execution_mode_context.get()
        progress_dict = progress_context.get() if execution_mode == "async" else None
        updates = execute_graph_to_updates(
            graph,
            context_dict=progress_dict,
            execution_mode=execution_mode,
        )

        final_outputs: dict[tuple[str, str], DataWrapper] = {}
        for update in updates:
            if update.status == "error":
                raise RuntimeError(update.terminal_output or "Cluster execution failed")
            if not update.outputs:
                continue
            for output_name, wrapper in update.outputs.items():
                final_outputs[(update.node_id, output_name)] = wrapper

        result: dict[str, Any] = {}
        for endpoint in cluster.outputs:
            key = (endpoint.node_id, endpoint.field_name)
            if key not in final_outputs:
                raise RuntimeError(
                    f"Cluster output target was not produced: "
                    f"{endpoint.node_id}.outputs.{endpoint.field_name}"
                )
            result[endpoint.public_name] = final_outputs[key].value

        if len(cluster.outputs) == 1:
            return result[cluster.outputs[0].public_name]
        return result

    execute_cluster.__name__ = cluster.name.replace(" ", "_")
    execute_cluster.__doc__ = f"Compiled cluster from {cluster.path}"
    return execute_cluster


def _schema_for_cluster(cluster: PendingCluster) -> FunctionSchema:
    arguments = {
        endpoint.public_name: endpoint.wrapper.model_copy(deep=True)
        for endpoint in cluster.inputs
    }
    outputs = {
        endpoint.public_name: DataWrapper(
            type=endpoint.wrapper.type,
            value=None,
        )
        for endpoint in cluster.outputs
    }

    return FunctionSchema(
        name=cluster.name,
        callable_id=cluster.callable_id,
        category=cluster.category,
        definition_path=cluster.path,
        doc=f"Compiled cluster from {cluster.path}",
        arguments=arguments,
        output_style="single" if len(outputs) == 1 else "multiple",
        outputs=outputs,
        auto_generated=True,
    )


def analyze_pnejson_clusters(
    pnejson_files: list[str],
    base_dir: str,
    available_callables: dict[str, Callable[..., Any]],
) -> tuple[list[FunctionSchema], dict[str, Callable[..., Any]]]:
    """Register .pnejson files with inspector-defined cluster interfaces.

    Missing dependencies make a cluster unavailable. Nested clusters work when
    their callable IDs are present and acyclic; cyclic or missing nested clusters
    are skipped with a warning instead of using stale embedded copies.
    """
    pending = [
        cluster
        for file_path in pnejson_files
        if (cluster := load_pending_cluster(file_path, base_dir)) is not None
    ]

    pending_by_id = {cluster.callable_id: cluster for cluster in pending}
    registered_ids = set(available_callables)
    schemas: list[FunctionSchema] = []
    callables: dict[str, Callable[..., Any]] = {}

    progressed = True
    while progressed:
        progressed = False
        for cluster in list(pending):
            missing = cluster.dependencies.difference(registered_ids)
            # Self-reference is always a cycle and can never make progress.
            if cluster.callable_id in cluster.dependencies:
                continue
            if missing:
                continue

            schema = _schema_for_cluster(cluster)
            callable_obj = _make_cluster_callable(cluster)
            schemas.append(schema)
            callables[cluster.callable_id] = callable_obj
            registered_ids.add(cluster.callable_id)
            pending.remove(cluster)
            progressed = True

    for cluster in pending:
        missing = cluster.dependencies.difference(registered_ids)
        nested_missing = missing.intersection(pending_by_id)
        if cluster.callable_id in cluster.dependencies or nested_missing:
            print(
                f"Cluster '{cluster.path}' was not registered because nested "
                "cluster dependencies are unavailable or cyclic"
            )
        elif missing:
            missing_sorted = ", ".join(sorted(missing))
            print(
                f"Cluster '{cluster.path}' was not registered because required "
                f"callables are missing: {missing_sorted}"
            )
        else:
            print(f"Cluster '{cluster.path}' was not registered")

    return schemas, callables
