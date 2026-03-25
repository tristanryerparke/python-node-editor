import sys
from inspect import isclass

# from devtools import debug as d
from ..types_analysis import get_type_repr
from .construct_nodes import create_construct_node
from .deconstruct_nodes import create_deconstruct_node


def create_const_deconst_models(types):
    from ...schema import UserModel

    model_schemas = []
    model_callables = {}

    for type_name, type_def in types.items():
        python_class = type_def._class
        # d(python_class)

        # find user_models
        if isclass(python_class):
            if issubclass(python_class, UserModel):
                # Get the module namespace for this class
                module_name = python_class.__module__
                module = sys.modules.get(module_name)
                module_ns = vars(module) if module else {}

                # Extract field names and types from the UserModel (used by both construct/deconstruct)
                field_names = []
                field_types = {}
                for field_name, field_info in python_class.model_fields.items():
                    if field_info.annotation is not None:
                        field_names.append(field_name)
                        field_types[field_name] = get_type_repr(
                            field_info.annotation,
                            module_ns,
                            short_repr=True,
                        )

                # Handle construction node
                if python_class.__dict__.get("_construct_node", False):
                    const_model, callable_id, constructor_func = create_construct_node(
                        python_class,
                        type_name,
                        type_def,
                        field_names,
                        field_types,
                        module_ns,
                    )
                    model_schemas.append(const_model)
                    model_callables[callable_id] = constructor_func

                # Handle deconstruction node
                if python_class.__dict__.get("_deconstruct_node", False):
                    deconst_model, callable_id, deconstructor_func = (
                        create_deconstruct_node(
                            python_class,
                            type_name,
                            type_def,
                            field_names,
                            field_types,
                            module_ns,
                        )
                    )
                    model_schemas.append(deconst_model)
                    model_callables[callable_id] = deconstructor_func

    return model_schemas, model_callables
