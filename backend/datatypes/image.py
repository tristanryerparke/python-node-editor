from pydantic import BaseModel, Field, computed_field, field_serializer, PrivateAttr, ConfigDict
from typing import Union, Literal
import numpy as np
from PIL import Image
from io import BytesIO
import base64
import uuid

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

# Add this at the top of the file
image_database = {}

class ImageData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    _image_array: np.ndarray = PrivateAttr(default=None)

    def __init__(self, **data):
        super().__init__(**data)
        if 'image_array' in data:
            self._image_array = data['image_array']
            self.save_to_database()
        elif 'id' in data and data['id'] in image_database:
            self._image_array = image_database[data['id']]

    @property
    def image_array(self) -> np.ndarray:
        if self._image_array is None:
            self._image_array = image_database.get(self.id)
        if self._image_array is None:
            raise ValueError(f"No image found with id {self.id}")
        return self._image_array

    def save_to_database(self):
        image_database[self.id] = self._image_array

    @classmethod
    def from_database(cls, id: str):
        if id not in image_database:
            raise ValueError(f"No image found with id {id}")
        return cls(id=id)

    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
        data['image_array'] = self.id  # Store the ID instead of the array
        return data

    @classmethod
    def parse_obj(cls, obj):
        if 'image_array' in obj and isinstance(obj['image_array'], str):
            # If image_array is a string (ID), create instance with this ID
            return cls(id=obj['image_array'])
        return super().parse_obj(obj)

    @computed_field(alias="thumbnail", title="Reduced Size Thumbnail", repr=True)
    def thumbnail(self) -> str:
        img = Image.fromarray(self.image_array).convert("RGB")
        img.thumbnail((MAX_THUMBNAIL_SIZE, MAX_THUMBNAIL_SIZE), Image.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'

    @computed_field(alias="description", title="Image Description", repr=True)
    def description(self) -> str:
        type_string = get_type_string(self.image_array)
        return f'{self.image_array.shape[1]}x{self.image_array.shape[0]}px ({type_string})'

    @classmethod
    def from_base64(cls, base64_string: str):
        img = Image.open(BytesIO(base64.b64decode(base64_string.split(',')[1])))
        return cls(image_array=np.array(img))
    
    @classmethod
    def from_file(cls, file_path: str):
        img = Image.open(file_path)
        return cls(image_array=np.array(img))