from fastapi import APIRouter, HTTPException

from python_node_editor.large_data.base import LARGE_DATA_CACHE, CachedDataWrapper
from python_node_editor.schema_base import CamelBaseModel

router = APIRouter()


class LargeDataUpload(CamelBaseModel):
    """Generic upload payload for any large data type"""

    type: str  # Discriminator: "CachedImage", "CachedDataFrame", etc.
    filename: str
    data: dict  # Type-specific data (e.g., {"img_base64": "..."})


@router.post("/upload_large_data")
async def upload_large_data(upload: LargeDataUpload):
    """
    Universal endpoint for uploading large data of any registered cached type.

    Uses server.TYPES to look up the cached type class.
    Each class's deserialize_to_cache() method parses its specific format into a python object and caches it.
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

        # Get the _referenced_datamodel (the CachedDataWrapper subclass)
        if (
            not hasattr(type_def, "_referenced_datamodel")
            or type_def._referenced_datamodel is None
        ):
            raise HTTPException(
                status_code=500,
                detail=f"Type {upload.type} does not have a referenced_datamodel",
            )

        cached_data_class = type_def._referenced_datamodel

        # Verify it's a CachedDataWrapper subclass
        if not issubclass(cached_data_class, CachedDataWrapper):
            raise HTTPException(
                status_code=500,
                detail=f"Type {upload.type} class is not a CachedDataWrapper subclass",
            )

        # Prepare full data dict for deserialization
        full_data = {
            "type": upload.type,
            "filename": upload.filename,
            **upload.data,
        }

        # Deserialize using the class-specific method
        instance = cached_data_class.deserialize_to_cache(full_data)

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
