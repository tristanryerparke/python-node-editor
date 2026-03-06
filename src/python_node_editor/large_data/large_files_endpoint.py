import uuid
from dataclasses import dataclass
from typing import Any, Callable

from fastapi import APIRouter, HTTPException
from python_node_editor.schema_base import CamelBaseModel


router = APIRouter()

# Global cache for large data values
LARGE_DATA_CACHE: dict[str, Any] = {}


@dataclass(frozen=True)
class LargeDataHandlerSpec:
    type_name: str
    type_def: type
    deserializer: Callable[[dict], tuple[Any, dict | None]]
    metadata_generator: Callable[[Any], dict[str, Any]] | None = None
    reference_model: type | None = None

class CachedValueReference(CamelBaseModel):
    """Small class to to represent a cached value in the backend
    can be sent two and from the frontend"""

    instance_type: str | None = None
    cache_key: str


class LargeDataUpload(CamelBaseModel):
    """Input model for receiving large data via the /cache endpoint"""
    callable_id: str | None = None
    type: str  # Discriminator: "Image", "CachedDataFrame", etc.
    data: dict 


@router.post("/cache")
async def cache_large_data(upload: LargeDataUpload):
    from python_node_editor.server import CALLABLES

    # Find the function that stores the handlers we need to
    func_obj = CALLABLES.get(upload.callable_id)
    if func_obj is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown callable_id: {upload.callable_id}",
        )

    handlers: dict = getattr(func_obj, "_large_data_handlers", None)
    handler_spec = handlers[upload.type]
    # Data and metadata from frontend come in
    data_deserialized, frontend_metadata = handler_spec.deserializer(upload.data)

    cache_key = str(uuid.uuid4())

    # Cache it
    LARGE_DATA_CACHE[cache_key] = data_deserialized

    backend_metadata = handler_spec.metadata_generator(data_deserialized)

    frontend_object = handler_spec.reference_model(
        cache_key=cache_key, 
        instance_type=upload.type,
        **backend_metadata | frontend_metadata
    )

    return frontend_object




@router.get("/cache_exists/{cache_key}")
async def cache_exists(cache_key: str):
    """Check if a cache key exists in LARGE_DATA_CACHE"""
    return {"exists": cache_key in LARGE_DATA_CACHE}
