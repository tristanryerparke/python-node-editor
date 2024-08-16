from fastapi import FastAPI, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import inspect
from typing import get_type_hints, get_origin, Union, Dict
from utils import find_and_load_classes, topological_sort

from docarray import BaseDoc
from devtools import debug as d
from typing import List, Dict, Any, get_args


from base_node import BaseNode, StreamingBaseNode
from execution import execution_router
from node_list import node_list_router


def format_type(t):
    if get_origin(t) is Union and set(get_args(t)) == {float, int}:
        return 'float'
    elif t is float:
        return 'float'
    elif t is int:
        return 'int'
    else:
        raise Exception(f"Unknown type {t}")




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# @app.get("/status")
# def get_status():
#     new_items = None
#     if wrapper.current_stream:
#         new_items = wrapper.current_stream[wrapper.last_sent_index + 1:]
#         wrapper.last_sent_index = len(wrapper.current_stream) - 1
#     return {
#         "current_node": wrapper.current_node,
#         "stream": new_items,
#         "nodes": wrapper.node_instances
#     }

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

import sys

def on_closed():
    print("Window is closing. Shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    import subprocess
    import os
    import sys
    import webview
    import time

    # Start the frontend as a non-blocking subprocess
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    frontend_process = subprocess.Popen(['bun', 'run', 'dev'], cwd=frontend_path)

    # Start the backend as a non-blocking subprocess
    backend_process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'])

    # Give some time for the processes to start
    time.sleep(0.5)

    # Create and start the webview
    window = webview.create_window('Python Node Editor', 'http://localhost:5173/', width=1920, height=1080)
    window.events.closed += on_closed
    webview.start()

    # Clean up subprocesses
    frontend_process.terminate()
    backend_process.terminate()