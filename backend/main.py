from fastapi import FastAPI, BackgroundTasks, Body, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import inspect

from starlette.websockets import WebSocketState, WebSocketDisconnect


from typing import get_type_hints, get_origin, Union, Dict
from utils import find_and_load_classes, topological_sort


from devtools import debug as d
from typing import List, Dict, Any, get_args


from base_node import BaseNode, StreamingBaseNode
from routes.execution import execution_router
from routes.node_list import node_list_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execution_router)
app.include_router(node_list_router)

        
if __name__ == "__main__":
    import sys
    import uvicorn
    sys.exit(uvicorn.main(["main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]))
