import base64
import io

from PIL import Image
from PIL import ImageOps

THUMBNAIL_MAX_SIZE = 500


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
