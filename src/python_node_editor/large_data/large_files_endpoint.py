from fastapi import APIRouter, HTTPException

from python_node_editor.large_data.base import LARGE_DATA_CACHE, CachedDataWrapper
from python_node_editor.schema_base import CamelBaseModel

router = APIRouter()


class LargeDataUpload(CamelBaseModel):
    """Generic upload payload for any large data type"""

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
    from python_node_editor.server import TYPES

    try:
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
        full_data = upload.model_dump()

        # Deserialize using the generic wrapper
        instance = CachedDataWrapper.deserialize_to_cache(full_data)

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
