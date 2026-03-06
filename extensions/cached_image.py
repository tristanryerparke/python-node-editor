from typing import Any
from PIL import Image

from python_node_editor.display import add_node_options
from python_node_editor.large_data.large_files_endpoint import LargeDataHandlerSpec, CachedValueReference
from extensions.image_utils import generate_thumbnail_base64, _decode_image_base64

class CachedImageReference(CachedValueReference):
    preview: str | None = None
    display_name: str | None = None
    filename: str | None = None

def deserialize_image_from_frontend(data: dict) -> tuple[Any, dict]:
    """This function gets called when you want to store an image in the cache
    you need to return the image and an optional """
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
