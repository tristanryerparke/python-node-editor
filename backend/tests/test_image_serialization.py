import sys
import os
import numpy as np
from PIL import Image
from typing import Union, Any, List
from pydantic import BaseModel, Field, SerializeAsAny, model_validator, field_validator
import base64
import json
from io import BytesIO
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.class_defs.image import ImageData, ThumbnailData
from backend.classes import NodeOutputImage
from backend.base_node import BaseNodeData



class FakeNode(BaseModel):
    data: BaseNodeData


if __name__ == '__main__':

    fn = FakeNode(
        data=BaseNodeData(
            outputs=[
                NodeOutputImage(
                    label='test',
                    type='image',
                    output_data=ImageData.from_file('backend/tests/download (6).png')
                )
            ]
        )
    )

    exclude_object = {'data': {'outputs': {'__all__': {'output_data': {'image_array'}}}}}

    partial_json = fn.model_dump_json(exclude=exclude_object)

    print(partial_json)

    partial_reconstructed = FakeNode.model_validate_json(partial_json)
    print('PARTIAL RECONSTRUCTED:')
    print(partial_reconstructed)

    full_json = fn.model_dump_json()

    components = json.loads(full_json)['data']['outputs'][0]['output_data'].items()
    # components = json.loads(full_json)['data']['outputs'][0]['output_data'].items()

    for value, component in components:
        print(f'{value}: {len(component)}')




    full_reconstructed = FakeNode.model_validate(json.loads(full_json))
    # print('FULL RECONSTRUCTED:')
    # print(full_reconstructed)



# if __name__ == '__main__':
#     # Test with regular image file
#     image = ImageData(
#         image_array=np.array(Image.open('backend/tests/download (6).png'))
#     )
#     p = ImageOutputField(output_data=image)

#     # print(p)

#     partial_json = p.model_dump_json(exclude={'output': {'image_array'}})
    
#     print("RECONSTRUCTED")
#     reconstructed = ImageOutputField.model_validate_json(partial_json)

#     print(reconstructed)

#     full_json = p.model_dump_json()

#     print("RECONSTRUCTED FULL")
#     reconstructed_full = ImageOutputField.model_validate(json.loads(full_json))
    
#     print(reconstructed_full)