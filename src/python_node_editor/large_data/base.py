import json
import uuid
from typing import Any, Callable, ClassVar, Self

from pydantic import (
    ConfigDict,
    Field,
    SerializerFunctionWrapHandler,
    ValidationInfo,
    field_serializer,
    model_serializer,
    model_validator,
)

from python_node_editor.schema_base import CamelBaseModel

# Global cache for large data values
LARGE_DATA_CACHE = {}
CACHE_KEY_PREFIX = "$cacheKey:"

LargeDataUploadHandler = Callable[[dict], tuple[Any, dict]]
LargeDataMetadataHandler = Callable[[Any], dict]

_LARGE_DATA_UPLOAD_HANDLERS: dict[str, LargeDataUploadHandler] = {}
_LARGE_DATA_METADATA_HANDLERS: dict[str, LargeDataMetadataHandler] = {}


def register_large_data_upload_handler(type_name: str, handler: LargeDataUploadHandler):
    _LARGE_DATA_UPLOAD_HANDLERS[type_name] = handler


def register_large_data_metadata_handler(type_name: str, handler: LargeDataMetadataHandler):
    _LARGE_DATA_METADATA_HANDLERS[type_name] = handler


def _get_large_data_upload_handler(type_name: str) -> LargeDataUploadHandler | None:
    return _LARGE_DATA_UPLOAD_HANDLERS.get(type_name)


def _get_large_data_metadata_handler(type_name: str) -> LargeDataMetadataHandler | None:
    return _LARGE_DATA_METADATA_HANDLERS.get(type_name)


def _estimate_size_bytes(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (bytes, bytearray)):
        return len(value)
    if isinstance(value, str):
        return len(value.encode("utf-8"))
    try:
        return len(json.dumps(value).encode("utf-8"))
    except Exception:
        return None


def _default_display_name(type_name: str, size_bytes: int | None) -> str:
    if size_bytes is None:
        return type_name
    size_kb = size_bytes / 1024
    return f"{type_name} ({size_kb:.1f} KB)"


class CachedDataWrapper(CamelBaseModel):
    """
    Generic wrapper for cached data types.

    Cached types are too large to send back and forth with the execute and update messages.
    Instead we store them in LARGE_DATA_CACHE during execution with a cache_key.
    On the frontend there will be an upload input component that will populate the cache
    via the /cache endpoint which will return a value field like
    "$cacheKey:xxx" as a reference on the frontend.
    Metadata like preview/thumbnail can be attached via registered handlers.
    Then when the execute message gets recieved, the backend programmatically creates an instance of this
    wrapper and retrieves the value from the cache.

    The model validator in schema.py detects cached values and populates this wrapper,
    retrieving the value from the cache and making it available to the execution engine.

    For propogating updates across edges, we just set the input's wrapper to a model_copy() of
    the wrapper.
    """

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        extra="ignore",
        serialize_by_alias=True,
        populate_by_name=True,
    )
    _is_cached_type: ClassVar[bool] = True  # Marker for type discovery

    type: str  # TODO: can we have StructDescr unions, dicts, lists later?
    value: Any | None = Field(exclude=True, default=None)
    cache_key: str | None = Field(
        serialization_alias="value",
        default_factory=lambda: str(uuid.uuid4()),
    )
    preview: str | None = None
    display_name: str | None = None
    filename: str | None = None
    size_bytes: int | None = None

    @model_validator(mode="before")
    @classmethod
    def extract_cache_key(cls, data):
        if isinstance(data, dict):
            raw_value = data.get("value")
            if isinstance(raw_value, str) and raw_value.startswith(CACHE_KEY_PREFIX):
                data = dict(data)
                data["cache_key"] = raw_value.split(":", 1)[1]
                data["value"] = None
        return data

    @field_serializer("cache_key")
    def serialize_cache_key(self, cache_key: str | None):
        if cache_key is None:
            return None
        return f"{CACHE_KEY_PREFIX}{cache_key}"

    @model_validator(mode="after")
    def populate_value_from_cache(self, info: ValidationInfo):
        """
        Validation hook that populates the value field from the cache if it's not set.

        This allows the frontend to send just {type, value} and have the value
        automatically loaded from LARGE_DATA_CACHE during validation.

        Uses validation context to determine when to populate from cache.
        Only populates when context={'populate_from_cache': True} is passed.
        This ensures it only runs for frontend deserialization, not Python instantiation.
        """
        # Check if validation context requests cache population
        should_populate = isinstance(info.context, dict) and info.context.get(
            "populate_from_cache", False
        )

        if (
            should_populate
            and self.value is None
            and self.cache_key in LARGE_DATA_CACHE
        ):
            self.value = LARGE_DATA_CACHE[self.cache_key]
        return self

    @model_validator(mode="after")
    def populate_metadata_from_value(self):
        if self.value is None:
            return self

        metadata_handler = _get_large_data_metadata_handler(self.type)
        if metadata_handler and (self.preview is None or self.display_name is None):
            metadata = metadata_handler(self.value)
            for key, value in metadata.items():
                if value is None:
                    continue
                if hasattr(self, key) and getattr(self, key) is None:
                    setattr(self, key, value)

        if self.size_bytes is None:
            self.size_bytes = _estimate_size_bytes(self.value)
        if self.display_name is None:
            self.display_name = _default_display_name(self.type, self.size_bytes)

        return self

    @model_serializer(mode="wrap")
    def serialize_with_cache_hook(self, handler: SerializerFunctionWrapHandler):
        """This is essentially a hook on the serialization process that ensures the cache data
        is populated before the data is sent to the frontend. This insures the frontend will always
        have a reference to the large data that was created in the backend.

        """
        LARGE_DATA_CACHE[self.cache_key] = self.value
        return handler(self)

    @classmethod
    def deserialize_to_cache(cls, data: dict) -> Self:
        """
        Deserialize from full data uploaded via the frontend.
        """
        type_name = data.get("type")
        if not type_name:
            raise ValueError("Missing required field for CachedDataWrapper: type")

        handler = _get_large_data_upload_handler(type_name)
        if handler:
            value, metadata = handler(data)
        else:
            payload = data.get("data")
            if isinstance(payload, dict) and "value" in payload and len(payload) == 1:
                value = payload.get("value")
            else:
                value = payload
            metadata = {}

        size_bytes = metadata.get("size_bytes") or _estimate_size_bytes(value)
        if size_bytes is not None:
            metadata.setdefault("size_bytes", size_bytes)

        if "display_name" not in metadata:
            metadata["display_name"] = _default_display_name(type_name, size_bytes)

        if "filename" not in metadata and data.get("filename") is not None:
            metadata["filename"] = data.get("filename")

        return cls(type=type_name, value=value, **metadata)

    @classmethod
    def from_cache_key(
        cls, cache_key: str, type_str: str | None = None
    ) -> "CachedDataWrapper":
        """
        Universal method to retrieve cached data by key.
        Works for all cached values.

        Used by graph.py to reconstruct cached values during execution.

        Args:
            cache_key: The key to look up in LARGE_DATA_CACHE
            type_str: Optional type string to set on the instance (e.g., "Image")
        """
        if cache_key not in LARGE_DATA_CACHE:
            raise ValueError(f"Cache key {cache_key} not found in LARGE_DATA_CACHE")

        value = LARGE_DATA_CACHE[cache_key]

        # Create instance with the cached value and type
        return cls(
            type=type_str
            or cls.__name__,  # Use provided type or fall back to class name
            value=value,  # type: ignore
            cache_key=cache_key,
        )


def is_cached_value(value) -> bool:
    """Helper to check if a value is a cached type instance"""
    return isinstance(value, CachedDataWrapper)
