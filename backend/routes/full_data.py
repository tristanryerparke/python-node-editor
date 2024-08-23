from fastapi import APIRouter, HTTPException
from ..base_node import BaseNode
from ..config import EXECUTION_WRAPPER
from ..class_defs.image import ImageData, image_database
import base64
from io import BytesIO
from PIL import Image

full_data_list_router = APIRouter()

@full_data_list_router.get("/image/{node_id}/{input_or_output}/{label}")
async def get_image(node_id: str, input_or_output: str, label: str):
    node: BaseNode = EXECUTION_WRAPPER.node_instances.get(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    data = node.data.inputs if input_or_output == "input" else node.data.outputs
    item = next((x for x in data if x.label == label), None)
    if not item:
        raise HTTPException(status_code=404, detail="Image not found")

    image_data = item.input_data if input_or_output == "input" else item.output_data
    if not isinstance(image_data, ImageData):
        raise HTTPException(status_code=400, detail="Not an image")

    image_array = image_database.get(image_data.id)
    if image_array is None:
        raise HTTPException(status_code=404, detail="Image data not found in database")

    img = Image.fromarray(image_array)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {"image": f"data:image/png;base64,{img_str}"}