from PIL import Image

from extensions.cached_image import image_cached_datatype


@image_cached_datatype
def create_checkerboard(
    width: int = 1024,
    height: int = 1024,
    square_size: int = 32,
) -> Image.Image:
    image = Image.new("RGB", (width, height))
    pixels = image.load()

    for y in range(height):
        for x in range(width):
            square_x = x // square_size
            square_y = y // square_size

            if (square_x + square_y) % 2 == 0:
                pixels[x, y] = (255, 255, 255)  # white
            else:
                pixels[x, y] = (0, 0, 0)  # black

    return image
