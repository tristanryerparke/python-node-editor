import base64
import io

from typing import Any
from PIL import Image
from PIL import ImageOps

from python_node_editor.display import add_node_options
from python_node_editor.large_data.large_files_endpoint import LargeDataHandlerSpec, CachedValueReference

THUMBNAIL_MAX_SIZE = 500


class CachedImageReference(CachedValueReference):
    preview: str | None = None
    display_name: str | None = None
    filename: str | None = None


def generate_thumbnail_base64(image: Image.Image, max_size: int = THUMBNAIL_MAX_SIZE) -> str:
    width, height = image.size
    if width > height:
        new_width = max_size
        new_height = int((height / width) * max_size)
    else:
        new_height = max_size
        new_width = int((width / height) * max_size)

    thumbnail = image.copy()
    thumbnail.thumbnail((new_width, new_height), Image.Resampling.LANCZOS)

    thumb_buffer = io.BytesIO()
    thumbnail.save(thumb_buffer, format="WEBP")
    thumb_base64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

    return thumb_base64


def _decode_image_base64(img_base64: str) -> Image.Image:
    img_data = base64.b64decode(img_base64)
    img = Image.open(io.BytesIO(img_data))
    # Strip rotation data (not required)
    img = ImageOps.exif_transpose(img)
    img.info.pop("exif", None)
    return img


def deserialize_image_from_frontend(data: dict) -> tuple[Any, dict]:

    img = _decode_image_base64(data["img_base64"])
    return img, {"filename": data.get("filename")}


def generate_metadata(value: Image.Image) -> dict:
    return {
        "preview": generate_thumbnail_base64(value),
        "display_name": f"Image({value.width}x{value.height}, {value.mode})",
    }


# Prebuilt decorator for easy reference
image_cached_datatype = add_node_options(
    cached_handlers=[
        LargeDataHandlerSpec(
            type_name="Image",
            type_def=Image.Image,
            deserializer=deserialize_image_from_frontend,
            metadata_generator=generate_metadata,
            reference_model=CachedImageReference,
        )
    ]
)
