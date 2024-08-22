from pydantic import BaseModel, Field, field_serializer
from typing import Union, Literal
import numpy as np
from PIL import Image as PILImage
from io import BytesIO
import base64

THUMBNAIL_SIZE = (200, 200)

def get_type_string(array: np.ndarray):
    if array.ndim == 2:
        return 'GRAYSCALE'
    elif array.ndim == 3:
        return 'RGB'
    elif array.ndim == 4:
        return 'RGBA'
    else:
        return 'unknown'


class Image(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    array: Union[np.ndarray, None] = Field(default=None)
    thumbnail: Union[str, None] = Field(default=None)
    encoded: Union[str, None] = Field(default=None)
    description: Union[str, None] = Field(default=None)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.create_description()

    @field_serializer('array', when_used='json')
    def serialize_array(self, v: np.ndarray, _info):
        return None

    @field_serializer('thumbnail')
    def serialize_thumbnail(self, thumbnail: str | None, _info):
        if thumbnail:
            return thumbnail
        return self.create_thumbnail()
    
    def create_description(self):
        if self.array is None:
            self.description = None
        else:
            type_string = get_type_string(self.array)
            self.description = f'{type_string} {self.array.shape[1]}x{self.array.shape[0]}px'

    def create_thumbnail(self):
        if self.array is None:
            return None
        thumbnail = PILImage.fromarray(self.array)
        thumbnail.thumbnail(THUMBNAIL_SIZE)
        buffer = BytesIO()
        thumbnail.save(buffer, format='JPEG')
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    @field_serializer('encoded')
    def serialize_encoded(self, encoded: str | None, _info):
        if encoded:
            return encoded
        return self.create_encoded()

    def create_encoded(self):
        if self.array is None:
            return None
        buffer = BytesIO()
        PILImage.fromarray(self.array).save(buffer, format='JPEG')
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    def model_dump(self, mode: Literal['full', 'thumbnail'] = 'thumbnail', **kwargs):
        data = super().model_dump(**kwargs)
        if mode == 'thumbnail':
            return {
                'thumbnail': self.thumbnail or self.create_thumbnail(),
                'description': self.description or self.create_description()
            }
        return data

    def model_dump_json(self, mode: Literal['full', 'thumbnail'] = 'thumbnail', **kwargs):
        if mode == 'thumbnail':
            exclude = {'array', 'encoded'}
        else:
            exclude = {'array'}
        return super().model_dump_json(exclude=exclude, **kwargs)

if __name__ == '__main__':
    import json
    image = Image(
        array=np.array(PILImage.open('backend/tests/download (6).png'))
    )
    print("\nThumbnail only:")
    j = image.model_dump_json(mode='thumbnail')
    print(json.loads(j))
    print(Image.model_validate_json(j))

    print(Image())