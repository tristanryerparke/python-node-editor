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

    elif dtype == 'basemodel':
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

def expire_old_cache():
    '''removes old cache data from disk'''
    try:
        with shelve.open(DISK_CACHE_FILE) as db:
            keys_to_delete = []
            for key in db:
                if datetime.now() - datetime.fromisoformat(db[key]['timestamp']) > DISK_CACHE_EXPIRY:
                    keys_to_delete.append(key)
            for key in keys_to_delete:
                del db[key]
    except Exception as e:
        print(f"Error expiring old cache: {e}")
        if os.path.exists(DISK_CACHE_FILE):
            os.remove(DISK_CACHE_FILE)

def save_cache_to_disk():
    '''saves the large data cache to disk'''
    try:
        expire_old_cache()
        with shelve.open(DISK_CACHE_FILE) as db:
            for key, value in LARGE_DATA_CACHE.items():
                db[key] = {
                    'data': field_data_serlialization_prep(value['dtype'], value['data']),
                    'dtype': value['dtype'],
                    'timestamp': datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error saving cache to disk: {e}")
        if os.path.exists(DISK_CACHE_FILE):
            os.remove(DISK_CACHE_FILE)

def get_or_load_from_cache(id: str):
    '''loads data from cache if it exists, otherwise loads from disk'''
    try:
        expire_old_cache()
        with shelve.open(DISK_CACHE_FILE) as db:
                if id in db:
                    value = db[id]
                    if datetime.now() - datetime.fromisoformat(value['timestamp']) < DISK_CACHE_EXPIRY:
                        data = field_data_deserilaization_prep(value['dtype'], value['data'])
                        print(f'Loading {id} from disk cache')
                        LARGE_DATA_CACHE[id] = {'data': data, 'dtype': value['dtype']}
                        return data
    except Exception as e:
        print(f"Error loading {id} from disk cache: {e}")
        if os.path.exists(DISK_CACHE_FILE):
            os.remove(DISK_CACHE_FILE)
    return None

#Stored data in LARGE_DATA_CACHE for id: 97ebcdde-004e-4593-b2dc-740ea33b6997