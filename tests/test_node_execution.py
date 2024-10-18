import json
import pytest
import numpy as np
from PIL import Image

# add backend to the system path
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.execution_wrapper import ExecutionWrapper
from backend.utils import find_and_load_classes
from backend.datatypes.field import NodeField

@pytest.mark.asyncio
async def test_simple_math():
    with open('tests/materials/nodes_math.json', 'r') as f:
        data = json.loads(f.read())

    wrapper = ExecutionWrapper()
    wrapper.classes_dict = find_and_load_classes("backend/nodes")
    
    
    # Create an event loop and run the coroutine
    result = await wrapper.execute_graph(
        data, 
        headless=True
    )

    assert result[2]['data']['outputs'][0]['data'] == 90


@pytest.mark.asyncio
async def test_images():
    with open('tests/materials/test_w_images.json', 'r') as f:
        data = json.loads(f.read())

    image = np.array(Image.open('tests/materials/monkey_1mb.png'))
    data['nodes'][0]['data']['outputs'][0]['data'] = image




    wrapper = ExecutionWrapper()
    wrapper.classes_dict = find_and_load_classes("backend/nodes")
    
    
    # Create an event loop and run the coroutine
    result = await wrapper.execute_graph(
        data, 
        headless=True
    )



if __name__ == "__main__":
    import asyncio
    # asyncio.run(test_simple_math())
    asyncio.run(test_images())