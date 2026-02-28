from fastapi import APIRouter, HTTPException

from python_node_editor.large_data.models import CachedDataWrapper
from python_node_editor.large_data.types import (
    LARGE_DATA_CACHE,
)
from python_node_editor.schema_base import CamelBaseModel

router = APIRouter()


class LargeDataUpload(CamelBaseModel):
    """Generic upload payload for any large data type"""

    callable_id: str | None = None
    type: str  # Discriminator: "Image", "CachedDataFrame", etc.
    filename: str | None = None
    data: dict  # Type-specific data (e.g., {"img_base64": "..."})


@router.post("/cache")
async def cache_large_data(upload: LargeDataUpload):
    """
    Universal endpoint for uploading large data of any registered cached type.

    Uses server.TYPES to verify the cached type.
    CachedDataWrapper.deserialize_to_cache() parses the payload and caches the data.
    """
    from python_node_editor.server import CALLABLES, TYPES

    try:
        # this shouldn't be able to happen..?
        # if not upload.callable_id:
        #     raise HTTPException(status_code=400, detail="Missing callable_id")

        func_obj = CALLABLES.get(upload.callable_id)
        if func_obj is None:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown callable_id: {upload.callable_id}",
            )

        handlers = getattr(func_obj, "_large_data_handlers", None)
        if isinstance(handlers, list):
            handlers = {handler.type_name: handler for handler in handlers}
        if not isinstance(handlers, dict):
            handlers = {}
        handler_spec = handlers.get(upload.type)
        deserializer = handler_spec.deserializer if handler_spec else None
        metadata_handler = handler_spec.metadata_generator if handler_spec else None
        if deserializer is None:
            raise HTTPException(
                status_code=400,
                detail=f"No deserializer registered for type {upload.type} on callable {upload.callable_id}",
            )

        # Look up the cached type in TYPES dictionary
        if upload.type not in TYPES:
            raise HTTPException(status_code=400, detail=f"Unknown type: {upload.type}")

        type_def = TYPES[upload.type]

        # Verify it's a cached type
        if type_def.kind != "cached":
            raise HTTPException(
                status_code=400,
                detail=f"Type {upload.type} is not a cached type. "
                f"Kind: {type_def.kind}",
            )

        # Prepare full data dict for deserialization
        full_data = upload.model_dump(exclude={"callable_id"})

        # Deserialize using the provided handler
        instance = CachedDataWrapper.deserialize_to_cache(
            full_data, deserializer=deserializer
        )
        if metadata_handler is not None:
            metadata = metadata_handler(instance.value)
            if metadata:
                instance = instance.model_copy(update=metadata)

        # Return serialized dict with all computed fields included
        return instance.model_dump()

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process {upload.type}: {str(e)}"
        )


@router.get("/cache_exists/{cache_key}")
async def cache_exists(cache_key: str):
    """
    Check if a cache key exists in LARGE_DATA_CACHE.

    Returns:
        {"exists": true} if the key exists
        {"exists": false} if the key does not exist
    """
    return {"exists": cache_key in LARGE_DATA_CACHE}
