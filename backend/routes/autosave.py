from fastapi import APIRouter, HTTPException
from ..utils import autosave

autosave_router = APIRouter()

@autosave_router.post("/autosave")
async def autosave_graph(graph_def: dict):
    autosave(graph_def)
    return {"message": "autosave complete"}