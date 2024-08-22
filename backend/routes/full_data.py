from fastapi import APIRouter, File, UploadFile
from ..base_node import BaseNode
from ..config import EXECUTION_WRAPPER

full_data_list_router = APIRouter()

@full_data_list_router.get("/full_data/{id}")
def get_full_node_data(id: str):


    node: BaseNode = EXECUTION_WRAPPER.node_instances[id]


    return node.model_dump_json()


# @full_data_list_router.post("/image_upload")
# def image_upload(file: UploadFile = File(...)):


#     return {"filename": file.filename}


