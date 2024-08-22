import asyncio
from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketState, WebSocketDisconnect
from ..config import EXECUTION_WRAPPER

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
                    asyncio.create_task(EXECUTION_WRAPPER.execute_graph(data["graph_def"]))
                    await websocket.send_json({"message": "Execution started"})
    except WebSocketDisconnect:
        pass
    finally:
        EXECUTION_WRAPPER.set_websocket(None)