from nodes.image_nodes import ImageFromUrlNode
from classes import NodeOutputImage
import numpy as np
from docarray.typing import ImageUrl
import json
ImageFromUrlNode.definition_path = 'test'


imn = ImageFromUrlNode()


j = imn.model_dump()

j_json = json.dumps(j)

image_url = ImageUrl('https://github.com/docarray/docarray/blob/main/tests/toydata/image-data/apple.png?raw=true')
image_tensor = np.array(image_url.load())

imn2 = ImageFromUrlNode.model_validate_json(j_json)

# print(imn2)

imn2.meta_exec()

print('hi')

# imn2.image_out = NodeOutputImage(value=image_tensor)



# output = imn2.data.outputs['image_out']
#This works:
print(imn2)

# print(output.model_dump_json()[:100])

#This doesn't work:
j2 = imn2.model_dump_json(warnings=False)
print(j2[:500])

