from fastapi import APIRouter, HTTPException

from python_node_editor.hook_utils import get_function_schema, run_schema_hooks
from python_node_editor.schema import HookActionMessage

router = APIRouter(prefix="/api")


@router.post("/hook_actions")
async def run_hook_actions(actions: list[HookActionMessage]):
    for action in actions:
        function_schema = get_function_schema(action.callable_id)
        if function_schema is None:
            raise HTTPException(
                status_code=404,
                detail=f"Unknown callable_id: {action.callable_id}",
            )

        run_schema_hooks(
            action.callable_id,
            action.action,
            {
                "action": action.action,
                "node_id": action.node_id,
                "callable_id": action.callable_id,
            },
        )

    return {
        "status": "success",
        "processed": len(actions),
    }
