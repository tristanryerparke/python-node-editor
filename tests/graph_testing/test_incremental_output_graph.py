"""
Tests for incremental terminal output updates using flush_output_to_frontend().
These tests verify that functions using flush_output_to_frontend() trigger
intermediate updates with accumulated terminal output.
"""

import asyncio
import time
from contextlib import asynccontextmanager

import httpx
import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport

import python_node_editor.server as server_module
from python_node_editor.analysis.functions_analysis import analyze_function
from python_node_editor.execution.exec_async import router as async_router
from python_node_editor.schema import Graph
from tests.assets.functions_with_delays import slow_add_with_update
from tests.assets.graph_utils import node_from_schema

# Analyze the function to get schema and types
_, schema, _, types = analyze_function(slow_add_with_update)

# Register the function and its types
server_module.CALLABLES[schema.callable_id] = slow_add_with_update
server_module.FUNCTION_SCHEMAS.append(schema)
server_module.TYPES.update(types)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Test Incremental Output - Python Node Editor", lifespan=lifespan)
app.include_router(async_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)


async def poll_execution_until_complete(
    client: httpx.AsyncClient, execution_id: str, timeout: float = 10.0
):
    """
    Poll execution status until completion or timeout.
    Returns list of all update snapshots received during polling.
    """
    start_time = time.time()
    snapshots = []
    last_update_index = -1

    while time.time() - start_time < timeout:
        response = await client.get(f"/api/execution_update/{execution_id}")
        assert response.status_code == 200
        data = response.json()

        current_index = data["updateIndex"]

        # Only store snapshots when something changed
        if current_index != last_update_index:
            snapshots.append(data)
            last_update_index = current_index
            node_updates = data.get("nodeUpdates", {})
            if node_updates:
                # Print debugging info about each snapshot
                for node_id, update in node_updates.items():
                    terminal_len = len(update.get("terminalOutput", ""))
                    print(
                        f"  Snapshot {current_index}: node={node_id}, status={update.get('status')}, terminal_len={terminal_len}"
                    )

        # Check if execution complete
        if data.get("status") == "complete":
            return snapshots

        await asyncio.sleep(0.01)  # Poll every 10ms to catch intermediate states

    print(f"Timeout! Last snapshots: {snapshots}")
    raise TimeoutError(f"Execution {execution_id} did not complete within {timeout}s")


@pytest.mark.asyncio
async def test_incremental_terminal_output_updates():
    """Test that print_with_update triggers incremental updates with accumulated output."""
    node1 = node_from_schema("node1", schema)
    node1.data.arguments["a"].value = 10
    node1.data.arguments["b"].value = 5

    graph = Graph(nodes=[node1], edges=[])

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Submit execution
        response = await client.post(
            "/api/execution_submit", json=graph.model_dump(by_alias=True)
        )
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]
        assert execution_id is not None

        # Poll until complete and collect all snapshots
        snapshots = await poll_execution_until_complete(client, execution_id)

        # We should have multiple snapshots:
        # 1. Initial "executing" status (update_index=0)
        # 2. First flush_output_to_frontend call (update_index=1)
        # 3. Second flush_output_to_frontend call (update_index=2)
        # 4. Third flush_output_to_frontend call (update_index=3)
        # 5. Final flush_output_to_frontend call + execution complete (update_index=4)
        # At minimum, we should have at least 3 snapshots
        assert len(snapshots) >= 3

        # Track terminal output progression
        terminal_progression = []
        for snapshot in snapshots:
            if "nodeUpdates" in snapshot and "node1" in snapshot["nodeUpdates"]:
                terminal = snapshot["nodeUpdates"]["node1"].get("terminalOutput", "")
                terminal_progression.append(terminal)

        # Verify terminal output grows over time
        # Terminal output should be progressively longer in each snapshot
        for i in range(1, len(terminal_progression)):
            # Each snapshot's terminal output should be at least as long as the previous
            assert len(terminal_progression[i]) >= len(terminal_progression[i - 1])

        # Final snapshot should contain all expected output
        final_terminal = terminal_progression[-1]
        assert "Adding 10 and 5 in 3 seconds" in final_terminal
        assert "Adding 10 and 5 in 2 seconds" in final_terminal
        assert "Adding 10 and 5 in 1 seconds" in final_terminal
        assert "10 + 5 = 15" in final_terminal

        # Verify final execution status
        final_snapshot = snapshots[-1]
        assert final_snapshot["status"] == "complete"

        # Verify final node update has correct status and output
        final_node_update = final_snapshot["nodeUpdates"]["node1"]
        assert final_node_update["status"] == "executed"
        assert final_node_update["outputs"]["return"]["value"] == 15
        assert final_node_update["terminalOutput"] == final_terminal


@pytest.mark.asyncio
async def test_multiple_incremental_updates_visible():
    """Test that each print_with_update call creates a visible update that the frontend can see."""
    node1 = node_from_schema("node1", schema)
    node1.data.arguments["a"].value = 7
    node1.data.arguments["b"].value = 3

    graph = Graph(nodes=[node1], edges=[])

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/execution_submit", json=graph.model_dump(by_alias=True)
        )
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]

        snapshots = await poll_execution_until_complete(client, execution_id)

        # Count how many times we saw the terminal output change
        terminal_output_changes = 0
        previous_terminal = ""
        for snapshot in snapshots:
            if "nodeUpdates" in snapshot and "node1" in snapshot["nodeUpdates"]:
                current_terminal = snapshot["nodeUpdates"]["node1"].get(
                    "terminalOutput", ""
                )
                if current_terminal != previous_terminal:
                    terminal_output_changes += 1
                    previous_terminal = current_terminal
                    print(
                        f"Terminal change #{terminal_output_changes}: {repr(current_terminal)}"
                    )

        # Should see at least 4 changes in terminal output:
        # 1. Empty (initial)
        # 2. After first flush_output_to_frontend ("Adding 7 and 3 in 3 seconds")
        # 3. After second flush_output_to_frontend ("Adding 7 and 3 in 2 seconds")
        # 4. After third flush_output_to_frontend ("Adding 7 and 3 in 1 seconds")
        # 5. After final flush_output_to_frontend ("7 + 3 = 10")
        assert terminal_output_changes >= 4


@pytest.mark.asyncio
async def test_incremental_updates_with_normal_print():
    """Test that mixing normal print() and flush_output_to_frontend() works correctly."""
    # This test uses the same slow_add_with_update which uses flush_output_to_frontend
    # The function prints and then sleeps, so we should see the updates accumulate
    node1 = node_from_schema("node1", schema)
    node1.data.arguments["a"].value = 1
    node1.data.arguments["b"].value = 2

    graph = Graph(nodes=[node1], edges=[])

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/execution_submit", json=graph.model_dump(by_alias=True)
        )
        assert response.status_code == 200
        result = response.json()
        execution_id = result["execution_id"]

        snapshots = await poll_execution_until_complete(client, execution_id)

        # Final snapshot
        final_snapshot = snapshots[-1]
        assert final_snapshot["status"] == "complete"

        # Check that we got the expected output
        final_terminal = final_snapshot["nodeUpdates"]["node1"]["terminalOutput"]
        assert "Adding 1 and 2 in 3 seconds" in final_terminal
        assert "Adding 1 and 2 in 2 seconds" in final_terminal
        assert "Adding 1 and 2 in 1 seconds" in final_terminal
        assert "1 + 2 = 3" in final_terminal


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
