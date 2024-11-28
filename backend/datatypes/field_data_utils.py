import io
import json
import base64
import reprlib
import shelve
import numpy as np
from PIL import Image
from typing import Any
import os
from datetime import datetime, timedelta

LARGE_DATA_CACHE = {}
DISK_CACHE_FILE = "large_data_cache"
DISK_CACHE_EXPIRY = timedelta(hours=2)

def image_to_base64(img: np.ndarray) -> str:
    '''converts a numpy array to a base64 encoded string'''
    img = Image.fromarray(img.astype(np.uint8))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')


def base64_to_image(base64_str: str) -> np.ndarray:
    '''converts a base64 encoded string to a numpy array'''
    if base64_str.startswith('data:image'):
        base64_str = base64_str.split(',', 1)[1]
    img_data = base64.b64decode(base64_str)
    return np.array(Image.open(io.BytesIO(img_data)))

def field_data_serlialization_prep(dtype: str, data: Any) -> str:
    '''catches and converts non-serializable small data types before sending to frontend'''

    if isinstance(data, type(None)):
        return data
    
    if dtype == 'json' or dtype == 'string' or dtype == 'number':
        return data

    elif dtype == 'numpy':
        return data.tolist()  # convert numpy array to list

    elif dtype == 'image':
        return image_to_base64(data)

    elif dtype == 'object':
        return data.model_dump()
    

    else:
        raise TypeError('unsupported dtype for frontend serialization')

def field_data_deserilaization_prep(dtype: str, data: Any) -> Any:
    '''re-instantiates non-serializable data types when receiving small data from frontend'''
    
    if isinstance(data, type(None)):
        return data
    
    elif dtype == 'json' or dtype == 'string' or dtype == 'number':
        return data  # json doesn't need preprocessing

    elif dtype == 'numpy':
        # if the data is already a numpy array, return it, this happens when creating a class
        if isinstance(data, np.ndarray):
            return data
        else:
            return np.array(data)  # convert list to numpy array

    elif dtype == 'image':
        if isinstance(data, np.ndarray):
            return data
        else:
            return base64_to_image(data)

    elif dtype == 'basemodel':
        return data

    elif dtype == 'object':
        return data

    else:
        raise TypeError('unsupported dtype for frontend deserialization')


def truncate_repr(obj):
    '''truncates the repr of large objects to keep the data payload small'''
    r = reprlib.Repr()
    r.maxstring = 200  # max characters for strings
    r.maxother = 200   # max characters for other repr
    return r.repr(obj).strip("'")

def create_thumbnail(data, max_file_size_mb):
    img = Image.fromarray(data.astype(np.uint8)).convert("RGB")
    max_pixels = int((max_file_size_mb * 1024 * 1024) / 3)  # 3 bytes per pixel for RGB
    max_side = int(np.sqrt(max_pixels))
    img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image_to_base64(np.array(img))

def get_string_size_mb(s: str) -> float:
    return len(s.encode('utf-8')) / (1024 * 1024)


def generate_image_metadata(data: np.ndarray, metadata: dict, max_file_size_mb: float) -> dict:
    metadata['preview'] = create_thumbnail(
        data, max_file_size_mb)
    metadata['height'] = data.shape[0]
    metadata['width'] = data.shape[1]
    if data.shape[2] == 1:
        metadata['type'] = "GRAYSCALE"
    elif data.shape[2] == 3:
        metadata['type'] = "RGB"
    elif data.shape[2] == 4:
        metadata['type'] = "RGBA"
    return metadata