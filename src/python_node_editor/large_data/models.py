import uuid
from typing import Any, ClassVar, Self, Callable

from pydantic import (
    ConfigDict,
    Field,
    SerializerFunctionWrapHandler,
    ValidationInfo,
    field_serializer,
    model_serializer,
    model_validator,
)

from python_node_editor.large_data.types import (
    CACHE_KEY_PREFIX,
    LARGE_DATA_CACHE,
)
from python_node_editor.schema_base import CamelBaseModel


class CachedDataWrapper(CamelBaseModel):
    """
    Generic wrapper for cached data types.

    Cached types are too large to send back and forth with the execute and update messages.
    Instead we store them in LARGE_DATA_CACHE during execution with a cache_key.
    On the frontend there will be an upload input component that will populate the cache
    via the /cache endpoint which will return a value field like
    "$cacheKey:xxx" as a reference on the frontend.
    Metadata like preview/thumbnail can be attached by callers (for example, execution-time handlers).
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

    @model_serializer(mode="wrap")
    def serialize_with_cache_hook(self, handler: SerializerFunctionWrapHandler):
        """Ensure cache data is populated before serializing to the frontend."""
        LARGE_DATA_CACHE[self.cache_key] = self.value
        return handler(self)

    @classmethod
    def deserialize_to_cache(
        cls,
        data: dict,
        deserializer: Callable,
    ) -> Self:
        """
        Deserialize from full data uploaded via the frontend.
        """
        type_name = data.get("type")
        if not type_name:
            raise ValueError("Missing required field for CachedDataWrapper: type")


        value, metadata = deserializer(data)

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
        """
        if cache_key not in LARGE_DATA_CACHE:
            raise ValueError(f"Cache key {cache_key} not found in LARGE_DATA_CACHE")

        value = LARGE_DATA_CACHE[cache_key]
        return cls(type=type_str or cls.__name__, value=value, cache_key=cache_key)


def is_cached_value(value) -> bool:
    """Helper to check if a value is a cached type instance."""
    return isinstance(value, CachedDataWrapper)
