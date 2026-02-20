from PIL.Image import Image

from extensions.cached_image import image_cached_datatype


@image_cached_datatype
def crop(
    image: Image,
    left: int = 0,
    top: int = 0,
    right: int = 0,
    bottom: int = 0,
) -> Image:
    width, height = image.size

    crop_box = (
        left,
        top,
        width - right,
        height - bottom,
    )

    cropped_image = image.crop(crop_box)
    return cropped_image
