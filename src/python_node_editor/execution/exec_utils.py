import io
import sys
import traceback
from typing import Any

from python_node_editor.schema import Graph, NodeDataFromFrontend, NodeFromFrontend
from python_node_editor.schema_base import StructDescr, UnionDescr

VERBOSE = False


def infer_concrete_type(value, type_descriptor, TYPES):
    """Infer the concrete type of a value from a type descriptor.

    Handles both simple types and union types by checking the runtime type
    of the value against the available types.
    """
    if isinstance(type_descriptor, UnionDescr):
        for candidate_type in type_descriptor.any_of:
            if candidate_type in TYPES:
                type_def = TYPES[candidate_type]
                if isinstance(value, type_def._class):
                    return candidate_type
        raise ValueError(
            f"Value {value} of type {type(value)} does not match any type in union {type_descriptor.any_of}"
        )

    if isinstance(type_descriptor, StructDescr):
        return type_descriptor

    if isinstance(type_descriptor, str):
        return type_descriptor

    raise ValueError(f"Unknown type descriptor: {type_descriptor}")


def execute_node(
    node: NodeDataFromFrontend, context_dict: dict[str, Any] | None = None
) -> tuple[bool, Any, str]:
    """Finds a node's callable and executes it with the arguments from the frontend

    Args:
        node: The node to execute
        context_dict: Optional dict containing 'callback' and 'buffer' keys for incremental updates

    Returns a tuple of (success, result, error_message)
    """
    from python_node_editor.large_data.models import (
        CachedValueReference,
        resolve_cached_runtime_value,
    )
    from python_node_editor.server import CALLABLES, TYPES

    callable = CALLABLES[node.callable_id]
    handlers = getattr(callable, "_large_data_handlers", None)
    if isinstance(handlers, list):
        handlers = {handler.type_name: handler for handler in handlers}
    if not isinstance(handlers, dict):
        handlers = {}

    def resolve_argument_value(wrapper) -> Any:
        arg_value = wrapper.value
        declared_type = wrapper.type if isinstance(wrapper.type, str) else None
        cached_type_name = declared_type
        if cached_type_name is None:
            return arg_value

        type_def = TYPES.get(cached_type_name)
        if not type_def or type_def.kind != "cached":
            return arg_value

        if arg_value is None:
            return None

        handler_spec = handlers.get(cached_type_name)
        reference_model = (
            handler_spec.reference_model
            if handler_spec and handler_spec.reference_model is not None
            else CachedValueReference
        )

        return resolve_cached_runtime_value(
            arg_value,
            expected_type=cached_type_name,
            reference_model=reference_model,
            expected_class=type_def._class,
        )

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_output = io.StringIO()
    sys.stdout = captured_output
    sys.stderr = captured_output

    # Store buffer reference in context dict so progress callbacks can read it
    if context_dict is not None:
        context_dict["buffer"] = captured_output

    try:
        if getattr(callable, "list_inputs", False):
            numbered_args = {}
            named_args = {}

            for k, v in node.arguments.items():
                arg_value = resolve_argument_value(v)

                if k.isdigit():
                    numbered_args[int(k)] = arg_value
                else:
                    named_args[k] = arg_value

            sorted_numbered_args = [
                numbered_args[i] for i in sorted(numbered_args.keys())
            ]

            named_args_values = list(named_args.values())

            all_args = named_args_values + sorted_numbered_args

            result = callable(*all_args)
        elif getattr(callable, "dict_inputs", False):
            args = {}
            for k, v in node.arguments.items():
                args[k] = resolve_argument_value(v)

            result = callable(**args)
        else:
            args = {}
            for k, v in node.arguments.items():
                args[k] = resolve_argument_value(v)

            result = callable(**args)

        sys.stdout = old_stdout
        sys.stderr = old_stderr
        terminal_output = captured_output.getvalue()

        if terminal_output:
            print(terminal_output, end="")

        return (True, result, terminal_output if terminal_output else "")

    except Exception as e:
        # Keep the buffer token in scope for the finally block
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        terminal_output = captured_output.getvalue()
        tb = e.__traceback__
        if tb and tb.tb_next:
            tb = tb.tb_next
            formatted_tb = "".join(traceback.format_exception(type(e), e, tb))
        else:
            formatted_tb = traceback.format_exc()

        if terminal_output:
            print(terminal_output, end="")
        print(formatted_tb, end="")

        combined_output = ""
        if terminal_output:
            combined_output += terminal_output
        combined_output += formatted_tb

        return (False, None, combined_output)


def topological_order(graph: Graph) -> list[NodeFromFrontend]:
    """
    Returns all nodes in topological order using DFS.
    Ensures dependencies are executed before dependents.
    """
    result: list[NodeFromFrontend] = []
    visited: set[str] = set()

    node_map: dict[str, NodeFromFrontend] = {node.id: node for node in graph.nodes}

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        for edge in graph.edges:
            if edge.target == node_id:
                visit(edge.source)

        result.append(node_map[node_id])

    sorted_nodes = sorted(
        graph.nodes, key=lambda node: node.position["x"] if node.position else 0
    )

    for node in sorted_nodes:
        visit(node.id)

    return result


def create_node_update(node, success, result, terminal_output, graph, execution_list):
    """Create a node update object from execution results"""
    from python_node_editor.large_data.models import (
        CachedValueReference,
        cache_runtime_value,
    )
    from python_node_editor.schema import DataWrapper, MultipleOutputs, NodeUpdate
    from python_node_editor.server import CALLABLES, TYPES

    outputs = {}

    # if there was an error during execution, send error message
    if not success:
        return NodeUpdate(
            node_id=node.id,
            status="error",
            terminal_output=terminal_output,
        )

    # Create a dict for processing the outputs whether there are one or multiple
    if node.data.output_style == "single":
        output_key = list(node.data.outputs.keys())[0]
        result_dict = {output_key: result}
    else:
        if isinstance(result, MultipleOutputs):
            result_dict = result.model_dump()
        else:
            result_dict = result

    # Generate the output data structures
    for output_name in node.data.outputs.keys():
        data = node.data.outputs[output_name]
        new_value = result_dict[output_name]

        concrete_type = infer_concrete_type(new_value, data.type, TYPES)

        metadata = {}
        if (
            isinstance(concrete_type, str)
            and concrete_type in TYPES
            and TYPES[concrete_type].kind == "cached"
        ):
            func_obj = CALLABLES.get(node.data.callable_id)
            handlers = (
                getattr(func_obj, "_large_data_handlers", None) if func_obj else None
            )
            if isinstance(handlers, list):
                handlers = {handler.type_name: handler for handler in handlers}
            if not isinstance(handlers, dict):
                handlers = {}
            handler_spec = handlers.get(concrete_type)
            metadata_handler = handler_spec.metadata_generator if handler_spec else None
            reference_model = (
                handler_spec.reference_model
                if handler_spec and handler_spec.reference_model is not None
                else CachedValueReference
            )
            if metadata_handler is not None:
                metadata = metadata_handler(new_value)
            new_value = cache_runtime_value(
                type_name=concrete_type,
                value=new_value,
                metadata=metadata,
                reference_model=reference_model,
            )

        output_data_model = DataWrapper(type=concrete_type, value=new_value)

        outputs[output_name] = output_data_model

    return NodeUpdate(
        node_id=node.id,
        status="executed",
        outputs=outputs or None,
        terminal_output=terminal_output,
    )
