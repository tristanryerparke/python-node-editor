import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketState, WebSocketDisconnect

from .routes.large_files_upload import large_files_router
from .routes.autosave import autosave_router
from .execution_wrapper import ExecutionWrapper
from .utils import find_and_load_classes
from .base_node import BaseNode
from .datatypes.compound import ListData
from .field import InputNodeField

CACHE_SAVE_INTERVAL_MINS = 1

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.include_router(large_files_router)
app.include_router(autosave_router)

EXECUTION_WRAPPER = ExecutionWrapper()
EXECUTION_WRAPPER.node_classes = find_and_load_classes("pne_backend.nodes")

# # load basic and compund datatypes defined in the datatypes directory
# DATATYPE_REGISTRY = dynamic_datatype_load('pne_backend.datatypes')

# # load compound datatypes attached to nodes
# DATATYPE_REGISTRY.update(dynamic_datatype_load('pne_backend.nodes.cme'))

# tell the fields about the datatype registry so they can infer classes when deserializing
# InputNodeField.datatype_registry = DATATYPE_REGISTRY
# ListData.datatype_registry = DATATYPE_REGISTRY


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
                    flow = data["flow"]
                    # print(f'Executing {flow["metadata"]["filename"]}')
                    print(f'Executing flow')
                    task = asyncio.create_task(EXECUTION_WRAPPER.execute_graph(
                        flow, 
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
    import time
    start_time = time.time()
    
    global EXECUTION_WRAPPER
    EXECUTION_WRAPPER.node_classes = find_and_load_classes("pne_backend.nodes")

    nodes_dict = {}
    for key, value in EXECUTION_WRAPPER.node_classes.items():
        category_list = []
        for node_class in value:
            instance: BaseNode = node_class(id='')
            category_list.append(instance.model_dump())
        nodes_dict[key] = category_list

    duration = time.time() - start_time
    print(f"get_all_nodes took {duration:.3f} seconds")
    
    return nodes_dict


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("pne_backend.main:app", host="0.0.0.0", port=8000)
