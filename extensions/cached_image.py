import base64
import io

from PIL import Image as ImageLibrary
from PIL import ImageOps
from PIL.Image import Image

from python_node_editor.display import add_node_options
from python_node_editor.large_data.base import LargeDataHandlerSpec

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


def _decode_image_base64(img_base64: str) -> Image:
    img_data = base64.b64decode(img_base64)
    img = ImageLibrary.open(io.BytesIO(img_data))
    # Strip rotation data (not required)
    img = ImageOps.exif_transpose(img)
    img.info.pop("exif", None)
    return img


def _image_upload_handler(payload: dict) -> tuple[Image, dict]:
    data = payload.get("data") or {}
    if not isinstance(data, dict):
        raise ValueError("Image upload data must be a dict")
    if "img_base64" not in data:
        raise ValueError("Missing required field for Image upload: img_base64")

    img = _decode_image_base64(data["img_base64"])
    preview = generate_thumbnail_base64(img)
    display_name = f"Image({img.width}x{img.height}, {img.mode})"

    return img, {
        "preview": preview,
        "display_name": display_name,
        "filename": payload.get("filename"),
    }


def _image_metadata_handler(value: Image) -> dict:
    return {
        "preview": generate_thumbnail_base64(value),
        "display_name": f"Image({value.width}x{value.height}, {value.mode})",
    }

# Prebuilt decorator for easy reference
image_cached_datatype = add_node_options(
    cached_handlers=[
        LargeDataHandlerSpec(
            type_name="Image",
            match_type=Image,
            upload=_image_upload_handler,
            metadata=_image_metadata_handler,
        )
    ]
)
