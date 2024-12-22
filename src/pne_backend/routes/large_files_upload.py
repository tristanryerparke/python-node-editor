from fastapi import APIRouter, UploadFile, File, Form
import numpy as np
from PIL import Image
import io
import json
import base64
from ..field import instantiate_data_class

large_files_router = APIRouter()

@large_files_router.post("/large_file_upload")
async def handle_large_file(
    file: UploadFile = File(...),
    original_filename: str = Form(...),
):
    '''receives a large file from a frontend and returns a field data instance with small preview that is cached'''
    from ..main import DATATYPE_REGISTRY
    file_content = await file.read()

    json_str = file_content.decode('utf-8')

    content_dict = json.loads(json_str)

    data_instance = instantiate_data_class(content_dict, DATATYPE_REGISTRY)

    data_instance.metadata['filename'] = original_filename


    return data_instance.model_dump()


