import base64
import io
from contextlib import asynccontextmanager

# from devtools import debug as d
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from PIL import Image
from python_node_editor.large_data.large_files_endpoint import router as data_router

import python_node_editor.server as server_module
from python_node_editor.large_data.base import CACHE_KEY_PREFIX, CachedDataWrapper
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.execution.exec_sync import router as graph_router
from python_node_editor.schema import Edge, Graph
from tests.assets.blur import blur_image
from tests.assets.graph_utils import node_from_schema

# Analyze the blur_image function to get types
_, schema, _, found_types = analyze_function(blur_image)

# Register the blur_image function and its types (don't clear, just update)
mock_callables = {
    schema.callable_id: blur_image,
}

server_module.CALLABLES.update(mock_callables)
server_module.TYPES.update(found_types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Python Node Editor - Image Graph", lifespan=lifespan)
app.include_router(graph_router)
app.include_router(data_router, prefix="/data")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

client = TestClient(app)


def extract_cache_key(value: str) -> str:
    assert value.startswith(CACHE_KEY_PREFIX)
    return value.split(":", 1)[1]


def test_app_setup():
    """Test that the blur_image function was analyzed correctly and Image type is registered"""
    # Verify Image type exists
    assert "Image" in server_module.TYPES.keys()

    # Verify Image type has correct structure
    image_type = server_module.TYPES["Image"]
    assert image_type.kind == "cached"
    assert image_type._class is Image.Image
    assert image_type._referenced_datamodel is None

    # Verify blur_image is registered
    assert schema.callable_id in server_module.CALLABLES


def test_image_upload():
    """Test uploading an image via the large_data endpoint"""
    # Create a test image
    test_image = Image.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Upload the image
    payload = {
        "type": "Image",
        "filename": "test_image.png",
        "data": {"img_base64": img_base64},
    }

    response = client.post("/data/cache", json=payload)
    assert response.status_code == 200

    result = response.json()
    assert "value" in result
    assert result["type"] == "Image"
    assert result["filename"] == "test_image.png"
    assert "preview" in result
    assert "displayName" in result
    assert result["value"].startswith(CACHE_KEY_PREFIX)
    assert len(result["preview"]) > 0
    assert "Image(100x100, RGB)" in result["displayName"]


def test_cache_exists():
    """Test checking if a cache key exists"""
    # Upload an image
    test_image = Image.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    payload = {
        "type": "Image",
        "filename": "test_image.png",
        "data": {"img_base64": img_base64},
    }

    response = client.post("/data/cache", json=payload)
    assert response.status_code == 200
    cache_key = extract_cache_key(response.json()["value"])

    # Check if it exists
    response = client.get(f"/data/cache_exists/{cache_key}")
    assert response.status_code == 200

    result = response.json()
    assert result["exists"] is True

    # Check a non-existent key
    response = client.get("/data/cache_exists/nonexistent_key")
    assert response.status_code == 200

    result = response.json()
    assert result["exists"] is False


def test_single_image_node_execute():
    """Test executing a single blur_image node"""
    # First upload an image
    test_image = Image.new("RGB", (100, 100), color="blue")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    upload_payload = {
        "type": "Image",
        "filename": "test_blur.png",
        "data": {"img_base64": img_base64},
    }

    upload_response = client.post("/data/cache", json=upload_payload)
    assert upload_response.status_code == 200
    upload_result = upload_response.json()
    cache_key = extract_cache_key(upload_result["value"])

    # Create graph with blur_image node
    node1 = node_from_schema("blur-node-1", schema)
    node1.data.arguments["image"] = CachedDataWrapper.from_cache_key(
        cache_key, type_str="Image"
    )
    node1.data.arguments["radius"].value = 20

    graph = Graph(nodes=[node1], edges=[])

    # Execute the graph
    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    assert len(result["updates"]) == 1

    # Verify the output
    node_update = result["updates"][0]
    assert node_update["nodeId"] == "blur-node-1"
    assert "outputs" in node_update
    assert "return" in node_update["outputs"]

    output = node_update["outputs"]["return"]
    assert output["type"] == "Image"
    assert "value" in output
    assert "preview" in output
    assert "displayName" in output
    assert output["value"].startswith(CACHE_KEY_PREFIX)
    assert len(output["preview"]) > 0


def test_two_connected_image_nodes():
    """Test executing two connected blur_image nodes"""
    # Upload an image
    test_image = Image.new("RGB", (100, 100), color="green")
    buffer = io.BytesIO()
    test_image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    upload_payload = {
        "type": "Image",
        "filename": "test_double_blur.png",
        "data": {"img_base64": img_base64},
    }

    upload_response = client.post("/data/cache", json=upload_payload)
    assert upload_response.status_code == 200
    cache_key = extract_cache_key(upload_response.json()["value"])

    # Create graph with two connected blur nodes
    node1 = node_from_schema("blur-node-1", schema)
    node1.data.arguments["image"] = CachedDataWrapper.from_cache_key(
        cache_key, type_str="Image"
    )
    node1.data.arguments["radius"].value = 10

    node2 = node_from_schema("blur-node-2", schema, position={"x": 200, "y": 0})
    node2.data.arguments["image"].value = None
    node2.data.arguments["radius"].value = 20

    edge1 = Edge(
        id="edge1",
        source="blur-node-1",
        source_handle="blur-node-1:outputs:return:handle",
        target="blur-node-2",
        target_handle="blur-node-2:inputs:image:handle",
    )

    graph = Graph(nodes=[node1, node2], edges=[edge1])

    # Execute the graph
    response = client.post("/graph_execute", json=graph.model_dump(by_alias=True))
    assert response.status_code == 200

    result = response.json()
    assert result["status"] == "success"
    # Now returns 3 updates: blur1, downstream arg update, blur2
    assert len(result["updates"]) == 3

    # Verify first node output
    node1_update = result["updates"][0]
    assert node1_update["nodeId"] == "blur-node-1"
    assert "return" in node1_update["outputs"]
    node1_output = node1_update["outputs"]["return"]
    assert node1_output["type"] == "Image"
    assert "value" in node1_output

    # Verify downstream argument propagation
    downstream_update = result["updates"][1]
    assert downstream_update["nodeId"] == "blur-node-2"
    assert "image" in downstream_update["arguments"]
    node2_input = downstream_update["arguments"]["image"]
    assert node2_input["type"] == "Image"
    assert node2_input["value"] == node1_output["value"]

    # Verify second node output
    node2_update = result["updates"][2]
    assert node2_update["nodeId"] == "blur-node-2"
    assert "return" in node2_update["outputs"]
    node2_output = node2_update["outputs"]["return"]
    assert node2_output["type"] == "Image"
    assert "value" in node2_output


if __name__ == "__main__":
    test_app_setup()
