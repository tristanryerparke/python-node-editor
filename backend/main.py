import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketState, WebSocketDisconnect
import json
import os
from datetime import datetime, timedelta

from .routes.full_data import full_data_list_router
from .routes.large_files_upload import large_files_router
from .execution_wrapper import ExecutionWrapper
from .utils import find_and_load_classes
from .datatypes.base_node import BaseNode
from .datatypes.field_data_utils import save_cache_to_disk

CACHE_SAVE_INTERVAL_MINS = 1

# 
@asynccontextmanager
async def lifespan(app: FastAPI):
    cache_save_task = asyncio.create_task(periodic_cache_save())
    yield
    # Shutdown
    cache_save_task.cancel()
    await cache_save_task
    save_cache_to_disk()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(full_data_list_router)
app.include_router(large_files_router)

EXECUTION_WRAPPER = ExecutionWrapper()
EXECUTION_WRAPPER.classes_dict = find_and_load_classes("backend/nodes")

async def periodic_cache_save():
    while True:
        await asyncio.sleep(CACHE_SAVE_INTERVAL_MINS * 60)
        save_cache_to_disk()
        print("Cache saved")

@app.websocket("/execute")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    EXECUTION_WRAPPER.set_websocket(websocket)
    tasks = []
    try:
        while True:
            if websocket.client_state == WebSocketState.CONNECTED:
                data = await websocket.receive_json()
                if data.get("action") == "execute":
                    task = asyncio.create_task(EXECUTION_WRAPPER.execute_graph(data["graph_def"]))
                    tasks.append(task)
                    await websocket.send_json({"event": 'execution_started'})
                elif data.get("action") == "cancel":
                    for task in tasks:
                        task.cancel()
                    tasks.clear()
                    # await websocket.send_json({"message": "execution_cancelled"})
    except WebSocketDisconnect:
        pass
    finally:
        EXECUTION_WRAPPER.set_websocket(None)

@app.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""
    EXECUTION_WRAPPER.classes_dict = {}
    EXECUTION_WRAPPER.classes_dict = find_and_load_classes("backend/nodes")

    nodes_dict = {}
    for key, value in EXECUTION_WRAPPER.classes_dict.items():
        category_list = []
        for node_class in value:
            instance: BaseNode = node_class(id='')
            category_list.append(instance.model_dump())
        nodes_dict[key] = category_list

    return nodes_dict

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)