from pydantic import BaseModel, Field, computed_field, field_validator

from typing import Union
import json
import numpy as np
from PIL import Image
import base64
from io import BytesIO


class ImageData(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    image_data: np.ndarray = Field(
        title="Large Image data",
        description="Image data",
        serialization_alias="thumbnail",
    )
    
    @computed_field(alias="thumbnail", title="Reduced Size Thumbnail")
    def thumbnail(self) -> str:
        img = Image.fromarray(self.image_data).resize((10, 10)).convert("RGB")
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'[:100]

class Parent(BaseModel):
    child: ImageData

d = ImageData(image_data=np.array(Image.open("download (6).png")))

# print(d)

lp = Parent(child=d)


print('Local Parent')

print(lp.model_dump_json(exclude={'child': {'Large Image Data'}}))
