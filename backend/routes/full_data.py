from fastapi import APIRouter, HTTPException
from ..datatypes.field_data_utils import field_data_serlialization_prep, LARGE_DATA_CACHE
from devtools import debug as d

full_data_list_router = APIRouter()

@full_data_list_router.get("/full_data/{data_id}")
async def get_data(data_id: str, dtype: str):
    cached_data = LARGE_DATA_CACHE.get(data_id, None)
    if cached_data is None:
        raise HTTPException(status_code=404, detail="Data not found in cache")
    else:
        up_data = field_data_serlialization_prep(dtype, cached_data)
        return up_data
