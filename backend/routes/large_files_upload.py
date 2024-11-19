from fastapi import APIRouter, UploadFile, File, Form
import numpy as np
from PIL import Image
import io
import json
import base64
from ..datatypes.field import FieldData

large_files_router = APIRouter()

@large_files_router.post("/large_file_upload")
async def handle_large_file(
    file: UploadFile = File(...),
    original_filename: str = Form(...),
):
    '''receives a large file from a frontend and returns a field data instance with small preview that is cached'''
    file_content = await file.read()

    json_str = file_content.decode('utf-8')

    data_instance = FieldData.model_validate_json(json_str)

    data_instance.metadata['filename'] = original_filename

    return data_instance.model_dump()


