from PIL.Image import Image

from extensions.cached_image import image_cached_datatype


@image_cached_datatype
def crop_size(
    image: Image,
    width: int = 512,
    height: int = 512,
    x_offset: int = 0,
    y_offset: int = 0,
) -> Image:
    img_width, img_height = image.size

    # Calculate centered position
    left = (img_width - width) // 2 + x_offset
    top = (img_height - height) // 2 + y_offset
    right = left + width
    bottom = top + height

    crop_box = (left, top, right, bottom)

    cropped_image = image.crop(crop_box)
    return cropped_image
