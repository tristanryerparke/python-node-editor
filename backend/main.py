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
from .routes.autosave import autosave_router
from .execution_wrapper import ExecutionWrapper
from .utils import find_and_load_classes
from .datatypes.base_node import BaseNode

CACHE_SAVE_INTERVAL_MINS = 1


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.include_router(full_data_list_router)
app.include_router(large_files_router)
app.include_router(autosave_router)

EXECUTION_WRAPPER = ExecutionWrapper()
EXECUTION_WRAPPER.classes_dict = find_and_load_classes("backend/nodes")

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
                    EXECUTION_WRAPPER.cancel_flag = False
                    flow_file = data["flow_file"]
                    print(f'Executing {flow_file["metadata"]["filename"]}')
                    task = asyncio.create_task(EXECUTION_WRAPPER.execute_graph(
                        flow_file, 
                        data["quiet"]
                    ))
                    tasks.append(task)
                    await websocket.send_json({"event": 'execution_started'})
                elif data.get("action") == "cancel":
                    EXECUTION_WRAPPER.cancel_flag = True
    except WebSocketDisconnect:
        pass
    finally:
        EXECUTION_WRAPPER.set_websocket(None)

@app.get("/all_nodes")
def get_all_nodes():
    """Finds and retrieves all nodes in the nodes directory"""
    global EXECUTION_WRAPPER
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