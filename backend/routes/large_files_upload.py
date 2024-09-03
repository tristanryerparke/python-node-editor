from fastapi import APIRouter, UploadFile, File, Form
from ..datatypes.field import NodeField
import numpy as np
from PIL import Image
import io
import json
from ..datatypes.field_data_utils import save_cache_to_disk

large_files_router = APIRouter()

@large_files_router.post("/large_file_upload")
async def handle_large_file(
    file: UploadFile = File(...),
    original_filename: str = Form(...),
    file_extension: str = Form(...)
):
    file_content = await file.read()

    json_str = file_content.decode('utf-8')

    data_instance = NodeField.model_validate_json(json_str)

    save_cache_to_disk()
    return data_instance.model_dump()


