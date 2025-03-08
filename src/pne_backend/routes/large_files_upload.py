from fastapi import APIRouter, UploadFile, File, Form
import numpy as np
from PIL import Image
import io
import json
import base64

large_files_router = APIRouter()

@large_files_router.post("/large_file_upload")
async def handle_large_file(
    file: UploadFile = File(...),
    original_filename: str = Form(...),
):
    '''receives a large file from a frontend and returns a field data instance with small preview that is cached'''
    from ..base_data import CLASS_REGISTRY
    from ..datatypes.image import ImageData
    
    file_content = await file.read()
    json_str = file_content.decode('utf-8')
    content_dict = json.loads(json_str)

    # Check if it's an image being uploaded
    if content_dict.get('class_name') == 'ImageData':
        # Use the same approach as in test_image_data_from_frontend
        try:
            # This will handle processing the base64 data, creating preview, etc.
            data_instance = ImageData.model_validate(content_dict, context={'state': 'deserializing'})
            
            # Add filename to metadata
            if not hasattr(data_instance, 'metadata'):
                data_instance.metadata = {}
            data_instance.metadata['filename'] = original_filename
            
            return data_instance.model_dump()
        except Exception as e:
            print(f"Error processing image data: {e}")
            # Fall back to regular processing
    
    # Use the same validation logic as in compound.py for non-image data
    discriminator = content_dict.get('class_parent') or content_dict.get('class_name')
    if discriminator and discriminator in CLASS_REGISTRY:
        data_instance = CLASS_REGISTRY[discriminator].model_validate(content_dict)
    else:
        data_instance = content_dict

    # Add filename to metadata
    if hasattr(data_instance, 'metadata'):
        data_instance.metadata['filename'] = original_filename

    # If it's a model instance with model_dump method
    if hasattr(data_instance, 'model_dump'):
        return data_instance.model_dump()
    # Fall back to dict if it's not a model instance
    return data_instance


