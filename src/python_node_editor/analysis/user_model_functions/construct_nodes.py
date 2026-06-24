import hashlib
import inspect

from pydantic import ValidationError

from ...errors import UserFacingNodeError

# from devtools import debug as d
from ..types_analysis import get_type_repr


def _model_definition_path(cls) -> str | None:
    try:
        return f"{inspect.getfile(cls)}:{inspect.getsourcelines(cls)[1]}"
    except (OSError, TypeError):
        return None


def _format_model_validation_error(
    action: str, cls, type_name: str, exc: ValidationError
) -> str:
    lines = [f"Validation error {action} {type_name}"]
    definition_path = _model_definition_path(cls)
    if definition_path is not None:
        lines.append(f"Model defined at {definition_path}")
    lines.extend(["", str(exc)])
    return "\n".join(lines)


def make_constructor(cls, type_name):
    def constructor(**kwargs):
        try:
            return cls.model_validate(kwargs)
        except ValidationError as exc:
            raise UserFacingNodeError(
                _format_model_validation_error("constructing", cls, type_name, exc)
            ) from None

    constructor.__name__ = f"construct_{type_name}"
    return constructor


def create_construct_node(
    python_class, type_name, type_def, field_names, field_types, module_ns
):
    from pydantic_core import PydanticUndefined

    from ...schema import FunctionSchema

    # Get the file path where the class is defined
    file_path = inspect.getfile(python_class)
    # Get the line number where the class is defined
    line_number = inspect.getsourcelines(python_class)[1]

    # Build arguments for constructor
    arguments = {}
    for field_name, field_info in python_class.model_fields.items():
        if field_info.annotation is not None:
            arg_entry = {"type": field_types[field_name]}

            # Check if field has a default value
            if field_info.default is not PydanticUndefined:
                arg_entry["value"] = field_info.default
            elif field_info.default_factory is not None:
                arg_entry["value"] = None
            else:
                arg_entry["value"] = None
            arguments[field_name] = arg_entry

    # Create the output - a single output returning the constructed UserModel
    outputs = {
        "return": {"type": get_type_repr(python_class, module_ns, short_repr=True)}
    }

    # Generate callable_id by hashing the class source code
    source_code = inspect.getsource(python_class)
    hash_digest = hashlib.sha256(source_code.encode()).hexdigest()
    callable_id = f"construct_{hash_digest[:16]}"

    const_model = FunctionSchema(
        name=f"construct-{type_name}",
        callable_id=callable_id,
        category=type_def.category,
        definition_path=f"{file_path}:{line_number}",
        doc=f"Construct a {type_name} instance",
        arguments=arguments,
        output_style="single",
        outputs=outputs,
        auto_generated=True,
    )

    # Create the callable constructor function
    constructor_func = make_constructor(python_class, type_name)

    # d(const_model)

    return const_model, callable_id, constructor_func
