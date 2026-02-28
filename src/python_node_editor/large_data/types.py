from dataclasses import dataclass
from typing import Any, Callable


# Global cache for large data values
LARGE_DATA_CACHE: dict[str, Any] = {}
CACHE_KEY_PREFIX = "$cacheKey:"



@dataclass(frozen=True)
class DeserializeResult:
    value: Any
    metadata: dict | None = None


@dataclass(frozen=True)
class LargeDataHandlerSpec:
    type_name: str
    type_def: type
    deserializer: Callable
    metadata_generator: Callable | None = None

