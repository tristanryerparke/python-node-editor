from PIL import ImageFilter
from PIL.Image import Image

from extensions.cached_image import image_cached_datatype


@image_cached_datatype
def blur_image(image: Image, radius: int = 40) -> Image:
    "Blurs and image by specifed kernel radius"
    blurred_image = image.filter(ImageFilter.GaussianBlur((radius, radius)))
    return blurred_image
