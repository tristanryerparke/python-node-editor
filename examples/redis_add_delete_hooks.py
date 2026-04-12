import json

from redis import Redis

from python_node_editor.display import add_node_options
from python_node_editor.runtime import add_hook, delete_hook

REDIS = Redis.from_url(
    "redis://localhost:6379/0",
    decode_responses=True,
)


def _store_node_in_redis(node_id, callable_id) -> None:
    REDIS.set(
        node_id,
        json.dumps(
            {
                "nodeId": node_id,
                "callableId": callable_id,
            }
        ),
    )


def _remove_node_from_redis(node_id) -> None:
    REDIS.delete(node_id)


@add_node_options(node_name="Redis Hooked Add", return_value_name="c")
@add_hook(_store_node_in_redis)
@delete_hook(_remove_node_from_redis)
def add(a: int, b: int) -> int:
    return a + b
