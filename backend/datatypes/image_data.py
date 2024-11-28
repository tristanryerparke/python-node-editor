from typing import Annotated, Union
from pydantic import BaseModel, ConfigDict, computed_field, WithJsonSchema
import numpy as np
import io
import base64
from PIL import Image


from .cachable_data import CachableData


def image_to_base64(img: Image.Image) -> str:
    '''converts a numpy array to a base64 encoded string'''
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')


def image_from_base64(base64_str: str) -> Image.Image:
    '''converts a base64 encoded string to a numpy array'''
    img_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(img_data))


def create_thumbnail(img: Image.Image, max_file_size_mb: float) -> Image.Image:
    '''create a thumbnail under a max file size of an image'''
    img = Image.fromarray(img.astype(np.uint8)).convert("RGB")
    max_pixels = int((max_file_size_mb * 1024 * 1024) / 4)  # ~4 bytes per pixel for RGBA
    max_side = int(np.sqrt(max_pixels))
    img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return img


class ImageData(CachableData):
    """CachableData for an image class with additional data about the image properties"""
    model_config: ConfigDict = {
        'arbitrary_types_allowed': True,
    }
    payload: Annotated[np.ndarray, WithJsonSchema({'type': 'image'})]

    @computed_field(repr=True)
    @property
    def width(self) -> int:
        return self.payload.shape[1]

    @computed_field(repr=True)
    @property
    def height(self) -> int:
        return self.payload.shape[0]

    @computed_field(repr=True)
    @property
    def image_type(self) -> str:
        if self.payload.shape[2] == 1:
            return 'GRAY'
        elif self.payload.shape[2] == 3:
            return 'RGB'
        elif self.payload.shape[2] == 4:
            return 'RGBA'

    @classmethod
    def deserialize_payload(cls, serialized_payload: Union[str, np.ndarray]) -> np.ndarray:
        """if the payload is a base64 encoded string, convert it to a numpy array
        otherwise, return the payload as is because it was created in the backend"""
        if isinstance(serialized_payload, str):
            return np.array(image_from_base64(serialized_payload))
        else:
            return serialized_payload

    @classmethod
    def preview_payload(cls, payload: np.ndarray) -> str:
        thumbnail = create_thumbnail(payload, cls.max_file_size_mb)
        return image_to_base64(thumbnail)
