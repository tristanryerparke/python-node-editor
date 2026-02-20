import re
import xml.etree.ElementTree as ET
from io import StringIO

import vpype
from annotated_types import MultipleOf
from devtools import debug as d
from pydantic import BaseModel, field_validator

from python_node_editor.schema import MultipleOutputs


class SVG(str):
    pass


class ViewBoxOutput(MultipleOutputs):
    top: float
    left: float
    width: float
    height: float


def extract_viewbox(svg_in: SVG) -> ViewBoxOutput:
    """Extracts the viewBox attribute from the SVG data and returns it as a tuple of four floats"""
    d(svg_in)
    root = ET.fromstring(svg_in)
    viewbox = root.attrib.get("viewBox")

    if viewbox is None:
        raise ValueError("SVG does not have a viewBox attribute")

    results = re.split("[ ,]+", viewbox)
    return ViewBoxOutput(
        top=float(results[1]),
        left=float(results[0]),
        width=float(results[2]),
        height=float(results[3]),
    )


def extract_layers(svg_in: SVG) -> list[SVG]:
    """
    Extracts the layers from the SVG data and returns them as a list of SVG objects using vpype.

    Args:
        svg_in: SVG content as a string

    Returns:
        List of SVG strings, one for each layer
    """
    # Use StringIO to handle the string input
    input_stream = StringIO(svg_in)

    # Read the multi-layer SVG using vpype
    doc = vpype.read_multilayer_svg(input_stream, quantization=1)
    layer_ids = doc.layers

    # For each layer, extract and return as string
    layer_contents = []
    for layer_id in layer_ids:
        # Create output stream for this layer
        output_stream = StringIO()

        # Create a new document with only this layer
        single_layer_doc = vpype.Document(page_size=doc.page_size)
        single_layer_doc.add(doc[layer_id], layer_id=layer_id)

        # Write to the string stream
        vpype.write_svg(output_stream, single_layer_doc)

        # Get the content and add to results
        layer_contents.append(SVG(output_stream.getvalue()))
        output_stream.close()

    return layer_contents


class SvgOutThree(MultipleOutputs):
    one: SVG
    two: SVG
    three: SVG


def expand_list_of_svgs_3(svg_list: list[SVG]) -> SvgOutThree:
    return SvgOutThree(one=svg_list[0], two=svg_list[1], three=svg_list[2])


def _test_builtin_subclass_preprocessor():
    """Test that the builtin_subclass pre-processor works correctly."""
    from python_node_editor.server import TYPES

    # Test data that mimics what comes from frontend
    test_data = {
        "arguments": {
            "svg_test": {"type": "SVG", "value": '<svg width="100" height="100"></svg>'}
        },
        "outputs": {
            "svg_output": {
                "type": "SVG",
                "value": '<svg width="200" height="200"></svg>',
            }
        },
    }

    # Simulate the pre-processor
    from python_node_editor.schema import NodeDataFromFrontend

    processed_data = NodeDataFromFrontend.model_validate(
        test_data, context={"populate_from_cache": True}
    )

    # Check that SVG strings were converted to SVG instances
    assert isinstance(processed_data.arguments["svg_test"], SVG)
    assert isinstance(processed_data.outputs["svg_output"], SVG)

    # Check that the values are correct
    assert "<svg" in processed_data.arguments["svg_test"]
    assert "<svg" in processed_data.outputs["svg_output"]

    print("✓ Builtin subclass pre-processor test passed!")


if __name__ == "__main__":
    test_builtin_subclass_preprocessor()
