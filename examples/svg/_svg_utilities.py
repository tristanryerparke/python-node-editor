import json
import tempfile
from pathlib import Path
from typing import List

import vpype_cli


def _extract_svg_layers(
    svg_string: str,
    tolerance: float = 0.05,
    optimize: bool = False,
) -> List[List]:
    # Create temporary files for input SVG and output JSON
    with tempfile.NamedTemporaryFile(mode="w", suffix=".svg", delete=False) as temp_svg:
        temp_svg.write(svg_string)
        temp_svg_path = temp_svg.name

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False
    ) as temp_json:
        temp_json_path = temp_json.name

    try:
        # Build the pipeline - NOTE: No -m flag means layers are preserved
        pipeline_parts = [
            f'read "{temp_svg_path}"',
            "linesort" if optimize else "",
            f"linesimplify -t {tolerance}",
            f'gwrite --profile json_t "{temp_json_path}"',
        ]
        pipeline = " ".join(part for part in pipeline_parts if part)

        # Execute the pipeline
        _ = vpype_cli.execute(pipeline)

        # Read the generated JSON file
        with open(temp_json_path, "r") as f:
            json_result = json.load(f)

        # Convert to list format
        layers_list = []

        if isinstance(json_result, list):
            # json_result is a list of layers
            for layer_paths in json_result:
                layers_list.append(layer_paths)

        return layers_list

    finally:
        # Clean up temporary files
        Path(temp_svg_path).unlink(missing_ok=True)
        Path(temp_json_path).unlink(missing_ok=True)
