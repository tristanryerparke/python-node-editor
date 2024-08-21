import base64
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field
from io import BytesIO
from typing import Any, Union

class NodeInput(BaseModel):
    label: str
    type: str
    value: Any = None

class NodeOutput(BaseModel):
    label: str
    type: str
    value: Any = None

def image_to_base64(im: np.ndarray) -> str:
    shape = im.shape
    buffered = BytesIO()
    img = Image.fromarray(im)
    img.save(buffered, format="PNG")

    if im.shape[2] == 3:
        image_type = 'RGB'
    elif im.shape[2] == 4:
        image_type = 'RGBA'
    else:
        image_type = 'Gray'

    short_display = f"({image_type}) {shape[0]}x{shape[1]}px "

    return {
        "short_display": short_display,
        "data": f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"
    }


class NodeOutputImage(NodeOutput):
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            np.ndarray: image_to_base64
        }
    type: str = 'image'
    value: Union[np.ndarray, None] = Field(None)



class NodeOutputNumber(NodeOutput):
    type: str = 'number'
    value: Union[int, float, None] = None

class NodeOutputString(NodeOutput):
    type: str = 'string'
    value: Union[str, None] = None