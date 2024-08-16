import asyncio
import json
from fastapi import APIRouter, BackgroundTasks, WebSocket
from starlette.websockets import WebSocketState, WebSocketDisconnect
from docarray import BaseDoc

from base_node import BaseNode, NodeInput
from execution_wrapper import ExecutionWrapper, ExecuteRequest

from shared_globals import CLASSES_DICT, EXECUTION_WRAPPER

execution_router = APIRouter()

@execution_router.websocket("/execute")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    EXECUTION_WRAPPER.set_websocket(websocket)
    try:
        while True:
            if websocket.client_state == WebSocketState.CONNECTED:
                data = await websocket.receive_json()
                if data.get("action") == "execute":
                    asyncio.create_task(EXECUTION_WRAPPER.execute_graph(data["graph_def"], CLASSES_DICT))
                    await websocket.send_json({"message": "Execution started"})
    except WebSocketDisconnect:
        pass
    finally:
        EXECUTION_WRAPPER.set_websocket(None)