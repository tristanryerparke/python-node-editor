import uuid
import io
import inspect
import sys
import traceback
from typing import Any

from devtools import debug as d
from python_node_editor.schema import Graph, NodeDataFromFrontend, NodeFromFrontend
from python_node_editor.schema_base import StructDescr, UnionDescr
from python_node_editor.large_data.large_files_endpoint import (
    CachedValueReference,
    LARGE_DATA_CACHE,
)

VERBOSE = False


def get_cache_key(value: Any) -> str | None:
    """Extract cache key from either a reference model or a plain dict."""
    if isinstance(value, CachedValueReference):
        return value.cache_key
    return None

def get_large_data_handlers(func_obj):
    return getattr(func_obj, "_large_data_handlers", {})

def resolve_cached_references(wrappers, node):
    """Replace cached value references in wrappers with runtime cached values."""
    from python_node_editor.server import CALLABLES

    func_obj = CALLABLES.get(node.callable_id)
    handlers = get_large_data_handlers(func_obj)
    # Most nodes have no cached handlers; exit fast so normal execution paths stay untouched.
    if not handlers:
        return wrappers
    if not isinstance(handlers, dict):
        handlers = {handler.type_name: handler for handler in handlers}

    for wrapper in wrappers.values():
        # Structured descriptors (e.g. StructDescr/UnionDescr) are not cache-handler keys.
        if not isinstance(wrapper.type, str):
            continue
        # Skip values that arent in the handlers dict
        if wrapper.type not in handlers:
            continue
        cache_key = get_cache_key(wrapper.value)
        if cache_key is not None and cache_key in LARGE_DATA_CACHE:
            wrapper.value = LARGE_DATA_CACHE[cache_key]
    return wrappers


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


def invoke_post_hook(post_hook, result, node_id: str | None = None):
    """Invoke a post hook, passing node_id when the hook supports it."""
    if node_id is None:
        post_hook(result)
        return

    try:
        signature = inspect.signature(post_hook)
    except (TypeError, ValueError):
        post_hook(result)
        return

    if "node_id" in signature.parameters:
        post_hook(result, node_id=node_id)
        return

    for parameter in signature.parameters.values():
        if parameter.kind == inspect.Parameter.VAR_KEYWORD:
            post_hook(result, node_id=node_id)
            return

    post_hook(result)


def execute_node(
    node: NodeDataFromFrontend,
    context_dict: dict[str, Any] | None = None,
    node_id: str | None = None,
) -> tuple[bool, Any, str]:
    """Finds a node's callable and executes it with the arguments from the frontend
    Return signature is:
        excecution success: bool
        result: Any
        terminal output
    """
    from python_node_editor.server import CALLABLES

    callable = CALLABLES[node.callable_id]
    node.arguments = resolve_cached_references(node.arguments, node)

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
                arg_value = v.value

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
                args[k] = v.value

            result = callable(**args)
        else:
            args = {}
            for k, v in node.arguments.items():
                args[k] = v.value

            result = callable(**args)

        post_hook = getattr(callable, "post_hook", None)
        if post_hook is not None:
            invoke_post_hook(post_hook, result, node_id=node_id)

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
    from python_node_editor.schema import DataWrapper, MultipleOutputs, NodeUpdate
    from python_node_editor.server import TYPES, CALLABLES

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

    result_wrappers = {}
    for output_name, output_wrapper in node.data.outputs.items():
        wrapper_copy = output_wrapper.model_copy()
        wrapper_copy.value = result_dict[output_name]
        result_wrappers[output_name] = wrapper_copy
    result_wrappers = resolve_cached_references(
        result_wrappers, node.data
    )

    # Generate the output data structures
    for output_name in node.data.outputs.keys():
        data = node.data.outputs[output_name]
        source_value = result_dict[output_name]
        new_value = result_wrappers[output_name].value

        concrete_type = infer_concrete_type(new_value, data.type, TYPES)

        # Check if we need to cache the output data and send a value reference object
        if (
            isinstance(concrete_type, str)
            and concrete_type in TYPES
            and TYPES[concrete_type].kind == "cached"
            and get_cache_key(source_value) is None
        ):
            # Create the cache key and store the data
            cache_key = str(uuid.uuid4())
            LARGE_DATA_CACHE[cache_key] = new_value

            # In create_node_update, callable_id lives on node.data (node is NodeFromFrontend).
            handlers = get_large_data_handlers(CALLABLES[node.data.callable_id])
            handler_spec = handlers.get(concrete_type)
            backend_metadata = handler_spec.metadata_generator(new_value)
            
            # Instantiate the reference model from the spec, with metadata and
            # replace the new value with the cached data reference model
            new_value = handler_spec.reference_model(
                cache_key=cache_key, 
                instance_type=concrete_type,
                **backend_metadata
            )

        output_data_model = DataWrapper(type=concrete_type, value=new_value)


        outputs[output_name] = output_data_model

    return NodeUpdate(
        node_id=node.id,
        status="executed",
        outputs=outputs or None,
        terminal_output=terminal_output,
    )
