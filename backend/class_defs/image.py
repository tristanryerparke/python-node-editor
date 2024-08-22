from pydantic import BaseModel, Field, computed_field, field_serializer
from typing import Union, Literal
import numpy as np
from PIL import Image
from io import BytesIO
import base64

MAX_THUMBNAIL_SIZE = 200

def get_type_string(array: np.ndarray):
    if array.ndim == 2:
        return 'GRAYSCALE'
    elif array.ndim == 3:
        return 'RGB'
    elif array.ndim == 4:
        return 'RGBA'
    else:
        raise ValueError(f"Invalid Image array shape: {array.shape}")
    
class ThumbnailData(BaseModel):
    thumbnail: str
    description: str

class ImageData(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    image_array: np.ndarray = Field(
        default=None, 
        title="Image Data", 
        description="The image data as a numpy array",
        serialization_alias="thumbnail"
    )

    @field_serializer("image_array")    
    def serialize_image_array(self, image_array: np.ndarray):
        img = Image.fromarray(image_array).convert("RGB")
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'
    

    # Compute the thumbnail upon instantiation
    @computed_field(alias="thumbnail", title="Reduced Size Thumbnail", repr=True)
    def thumbnail(self) -> str:
        img = Image.fromarray(self.image_array)
        img.thumbnail((MAX_THUMBNAIL_SIZE, MAX_THUMBNAIL_SIZE), Image.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'

    # Compute the description upon instantiation
    @computed_field(alias="description", title="Image Description", repr=True)
    def description(self) -> str:
        type_string = get_type_string(self.image_array)
        return f'{self.image_array.shape[1]}x{self.image_array.shape[0]}px ({type_string})'
    

    # Create from base64 string
    @classmethod
    def from_base64(cls, base64_string: str):
        img = Image.open(BytesIO(base64.b64decode(base64_string.split(',')[1])))
        return cls(image_array=np.array(img))
    
    @classmethod
    def from_file(cls, file_path: str):
        img = Image.open(file_path)
        return cls(image_array=np.array(img))