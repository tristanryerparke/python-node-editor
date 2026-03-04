from typing import Any

from python_node_editor.large_data.types import LargeDataHandlerSpec


def _coerce_handler_spec(handler: Any) -> LargeDataHandlerSpec:
    if isinstance(handler, LargeDataHandlerSpec):
        return handler
    raise ValueError("Large data handler must be a LargeDataHandlerSpec")


def normalize_large_data_handlers(
    handlers: list[LargeDataHandlerSpec] | dict[str, LargeDataHandlerSpec] | None,
) -> dict[str, LargeDataHandlerSpec]:
    if not handlers:
        return {}
    normalized: dict[str, LargeDataHandlerSpec] = {}
    if isinstance(handlers, dict):
        for type_name, handler in handlers.items():
            if not isinstance(handler, LargeDataHandlerSpec):
                raise ValueError("Large data handler must be a LargeDataHandlerSpec")
            spec = handler
            if spec.type_name != type_name:
                raise ValueError(
                    f"Large data handler type_name mismatch: {spec.type_name} != {type_name}"
                )
            if spec.type_def is None:
                raise ValueError(
                    f"Large data handler for {type_name} missing required type_def"
                )
            normalized[type_name] = spec
        return normalized
    for handler in handlers:
        spec = _coerce_handler_spec(handler)
        if not spec.type_name:
            raise ValueError("Large data handler missing required type_name")
        if spec.type_def is None:
            raise ValueError(
                f"Large data handler for {spec.type_name} missing required type_def"
            )
        normalized[spec.type_name] = spec
    return normalized


def get_large_data_handlers(func) -> dict[str, LargeDataHandlerSpec]:
    return normalize_large_data_handlers(getattr(func, "_large_data_handlers", None))


def get_large_data_handler(func, type_name: str) -> LargeDataHandlerSpec | None:
    if func is None:
        return None
    return get_large_data_handlers(func).get(type_name)
