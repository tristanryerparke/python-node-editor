from .config import app, CLASSES_DICT
from .routes.node_list import node_list_router
from .routes.execution import execution_router
from .routes.full_data import full_data_list_router
from .routes.large_files_upload import large_files_router

app.include_router(node_list_router)
app.include_router(execution_router)
app.include_router(full_data_list_router)
app.include_router(large_files_router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)