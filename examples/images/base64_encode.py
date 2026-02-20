import base64
from io import BytesIO

from PIL.Image import Image

from extensions.cached_image import image_cached_datatype


@image_cached_datatype
def image_to_base64(image: Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="WEBP")
    buffer.seek(0)
    base64_str = base64.b64encode(buffer.read()).decode("utf-8")
    return base64_str
