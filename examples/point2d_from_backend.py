import json
from pathlib import Path
import time

from python_node_editor.display import deconstruct, retrieve_input_data
from python_node_editor.schema_base import UserModel


def _retrieve_point2d_data():
    data_path = Path(__file__).resolve().parent.parent / "point2d_from_backend.json"
    time.sleep(2)
    with data_path.open("r", encoding="utf-8") as f:
        return json.load(f)


@retrieve_input_data(_retrieve_point2d_data)
@deconstruct
class Point2DFromBackend(UserModel):
    x: float
    y: float


def passthrough_point(point: Point2DFromBackend) -> Point2DFromBackend:
    return point
