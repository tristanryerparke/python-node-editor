import hashlib
import inspect

# from devtools import debug as d
from ..types_analysis import get_type_repr


def make_deconstructor(cls, type_name, field_names):
    def deconstructor(instance):
        # Extract field values and return as dict
        result = {
            field_name: getattr(instance, field_name) for field_name in field_names
        }
        # Wrap in a MultipleOutputs class for returning
        from ...schema import MultipleOutputs

        # Create a dynamic MultipleOutputs subclass
        outputs_class = type(
            f"{type_name}DeconstructOutputs",
            (MultipleOutputs,),
            {
                "__annotations__": {
                    field_name: getattr(instance, field_name).__class__
                    for field_name in field_names
                }
            },
        )
        return outputs_class(**result)

    deconstructor.__name__ = f"deconstruct_{type_name}"
    return deconstructor


def create_deconstruct_node(
    python_class, type_name, type_def, field_names, field_types, module_ns
):
    from ...schema import FunctionSchema

    # Get the file path where the class is defined
    file_path = inspect.getfile(python_class)
    # Get the line number where the class is defined
    line_number = inspect.getsourcelines(python_class)[1]

    # Build arguments for deconstructor (single input: the instance)
    arguments = {
        "instance": {
            "type": get_type_repr(python_class, module_ns, short_repr=True),
            "value": None,
        }
    }

    # Create multiple outputs - one for each field
    outputs = {
        field_name: {"type": field_types[field_name]} for field_name in field_names
    }

    # Generate callable_id by hashing the class source code
    source_code = inspect.getsource(python_class)
    hash_digest = hashlib.sha256(source_code.encode()).hexdigest()
    callable_id = f"deconstruct_{hash_digest[:16]}"

    deconst_model = FunctionSchema(
        name=f"deconstruct-{type_name}",
        callable_id=callable_id,
        category=type_def.category,
        definition_path=f"{file_path}:{line_number}",
        doc=f"Deconstruct a {type_name} instance into its fields",
        arguments=arguments,
        output_style="multiple",
        outputs=outputs,
        auto_generated=True,
    )

    # Create the callable deconstructor function
    deconstructor_func = make_deconstructor(python_class, type_name, field_names)

    # d(deconst_model)

    return deconst_model, callable_id, deconstructor_func
