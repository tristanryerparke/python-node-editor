from PIL.Image import Image, Transpose

from python_node_editor.datatypes.cached_image import image_cached_datatype
from python_node_editor.display import add_node_options


@add_node_options(return_value_name="flipped")
@image_cached_datatype
def flip_horizontal(image: Image) -> Image:
    flipped_image = image.transpose(Transpose.FLIP_LEFT_RIGHT)
    return flipped_image


@add_node_options(return_value_name="flipped")
@image_cached_datatype
def flip_vertical(image: Image) -> Image:
    flipped_image = image.transpose(Transpose.FLIP_TOP_BOTTOM)
    return flipped_image


@image_cached_datatype
def rotate_image(image: Image, angle: float = 90) -> Image:
    rotated_image = image.rotate(angle, expand=True)
    return rotated_image
