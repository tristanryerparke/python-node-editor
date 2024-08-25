import numpy as np
from PIL import Image
from pydantic import BaseModel, Field, computed_field
import uuid
from io import BytesIO
import base64

# Simple database
image_database = {}

MAX_THUMBNAIL_SIZE = 20

def get_type_string(array: np.ndarray):
    if array.ndim == 2:
        return 'GRAYSCALE'
    elif array.ndim == 3:
        return 'RGB'
    elif array.ndim == 4:
        return 'RGBA'
    else:
        raise ValueError(f"Invalid Image array shape: {array.shape}")

class ImageData(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_array: np.ndarray = Field(
        default=None, 
        title="Image Data", 
        description="The image data as a numpy array",
        exclude=True  # Exclude from serialization
    )

    def __init__(self, **data):
        super().__init__(**data)
        if self.image_array is not None:
            self.save_to_database()

    def save_to_database(self):
        image_database[self.id] = self.image_array

    @classmethod
    def from_database(cls, id: str):
        image_array = image_database.get(id)
        if image_array is None:
            raise ValueError(f"No image found with id {id}")
        return cls(id=id, image_array=image_array)

    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
        data['image_array'] = self.id  # Store the ID instead of the array
        return data

    @classmethod
    def parse_obj(cls, obj):
        if 'image_array' in obj and isinstance(obj['image_array'], str):
            # If image_array is a string (ID), load from database
            return cls.from_database(obj['image_array'])
        return super().parse_obj(obj)

    @computed_field(alias="thumbnail", title="Reduced Size Thumbnail", repr=True)
    def thumbnail(self) -> str:
        img = Image.fromarray(self.image_array)
        img.thumbnail((MAX_THUMBNAIL_SIZE, MAX_THUMBNAIL_SIZE), Image.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'

    @computed_field(alias="description", title="Image Description", repr=True)
    def description(self) -> str:
        type_string = get_type_string(self.image_array)
        return f'{self.image_array.shape[1]}x{self.image_array.shape[0]}px ({type_string})'

# Example usage
if __name__ == "__main__":
    # Create a sample image
    sample_image = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)

    # Create an ImageData instance
    image_data = ImageData(image_array=sample_image)
    print(f"Created ImageData with ID: {image_data.id}")

    # Serialize the ImageData
    serialized_data = image_data.dict()
    print("Serialized data:", serialized_data)

    # Check the database
    print("Database contents:", image_database.keys())

    # Deserialize the data
    deserialized_image_data = ImageData.parse_obj(serialized_data)
    print("Deserialized ImageData:")
    print(f"  ID: {deserialized_image_data.id}")
    print(f"  Shape: {deserialized_image_data.image_array.shape}")

    # Verify that the deserialized image is the same as the original
    np.testing.assert_array_equal(deserialized_image_data.image_array, sample_image)
    print("Deserialized image matches the original")