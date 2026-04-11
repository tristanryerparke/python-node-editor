def serialize_function_schemas(
    function_schemas,
    exclude_defaults=True,
    exclude_none=True,
):
    return [
        schema.model_dump(
            mode="json",
            exclude_defaults=exclude_defaults,
            exclude_none=exclude_none,
        )
        for schema in function_schemas
    ]


def serialize_types(
    types,
    exclude_defaults=False,
    exclude_none=False,
):
    return {
        type_name: type_schema.model_dump(
            mode="json",
            exclude_defaults=exclude_defaults,
            exclude_none=exclude_none,
        )
        for type_name, type_schema in types.items()
    }


def serialize_environment(function_schemas, types):
    return {
        "nodes": serialize_function_schemas(function_schemas),
        "types": serialize_types(types),
    }
