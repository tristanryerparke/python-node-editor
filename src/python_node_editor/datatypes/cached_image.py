# pyright: reportOptionalMemberAccess=false
import base64
import io

from PIL import Image as ImageLibrary
from PIL import ImageOps
from PIL.Image import Image
from pydantic import (
    Field,
    computed_field,
)

from python_node_editor.display import add_node_options
from python_node_editor.large_data.base import CachedDataWrapper

THUMBNAIL_MAX_SIZE = 500


def generate_thumbnail_base64(image: Image, max_size: int = THUMBNAIL_MAX_SIZE) -> str:
    width, height = image.size
    if width > height:
        new_width = max_size
        new_height = int((height / width) * max_size)
    else:
        new_height = max_size
        new_width = int((width / height) * max_size)

    thumbnail = image.copy()
    thumbnail.thumbnail((new_width, new_height), ImageLibrary.Resampling.LANCZOS)

    thumb_buffer = io.BytesIO()
    thumbnail.save(thumb_buffer, format="WEBP")
    thumb_base64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

    return thumb_base64


class CachedImageDataModel(CachedDataWrapper):
    """Cached image data wrapper for PIL Image objects"""

    value: Image | None = Field(
        exclude=True, default=None
    )  # we can't send the image object to the frontend so we exclude it
    filename: str | None = Field(default=None)

    @classmethod
    def deserialize_to_cache(cls, data: dict):
        """
        Deserialize image from base64 data uploaded from a non-execution action on the frontend.

        Expected data format:
        {
            "type": "Image",
            "filename": "example.png",
            "img_base64": "base64_encoded_string..."
        }
        """
        try:
            img_data = base64.b64decode(data["img_base64"])
            img = ImageLibrary.open(io.BytesIO(img_data))
            # Strip rotation data (not required)
            img = ImageOps.exif_transpose(img)
            img.info.pop("exif", None)

            return cls(
                type="Image",
                value=img,
                filename=data.get("filename"),
            )
        except KeyError as e:
            raise ValueError(f"Missing required field for CachedImageDataModel: {e}")
        except Exception as e:
            raise ValueError(f"Failed to deserialize CachedImageDataModel: {str(e)}")

    @computed_field
    @property
    def preview(self) -> str:
        if self.value is None:
            return ""
        return generate_thumbnail_base64(self.value)

    @computed_field
    @property
    def display_name(self) -> str:
        return f"Image({self.value.width}x{self.value.height}, {self.value.mode})"


image_cached_datatype = add_node_options(
    cached_types=[
        {"argument_type": Image, "associated_datamodel": CachedImageDataModel}
    ],
)
