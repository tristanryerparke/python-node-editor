from fastapi import APIRouter, HTTPException
from ..datatypes.field_data_utils import db_str_deserialize, prep_data_for_frontend_serialization
from ..datatypes.field_data import redis_client, Data

full_data_list_router = APIRouter()

@full_data_list_router.get("/data/{data_id}")
async def get_data(data_id: str, dtype: str):
    cached_data = redis_client.get(data_id)
    if cached_data is None:
        raise HTTPException(status_code=404, detail="Data not found in cache")
    else:
        deserialized_data = db_str_deserialize(frozenset(Data.class_options.items()), dtype, cached_data)
        up_data = prep_data_for_frontend_serialization(dtype, deserialized_data)
        print(up_data[:100])
        return up_data
