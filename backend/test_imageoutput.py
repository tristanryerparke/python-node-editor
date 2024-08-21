from classes import NodeOutputImage


from docarray.typing import ImageUrl, ImageNdArray

from devtools import debug as d

import json


image = ImageUrl('https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')

noi = NodeOutputImage()

noi.value = image.load()

print(noi.json())

