from io import BytesIO

import requests
from PIL import Image as ImageLibrary
from PIL.Image import Image

from python_node_editor.datatypes.cached_image import image_cached_datatype


@image_cached_datatype
def image_from_url(
    url: str = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/A-Cat.jpg/1024px-A-Cat.jpg",
) -> Image:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    image = ImageLibrary.open(BytesIO(response.content))
    # image.show()
    return image
