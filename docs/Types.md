# Types in Python Node Editor
PNE detects the all the input and output types specified on the functions it analyzes for use in the frontend. However without writing your own TS components, the frontend only has support for input/output display of certain types (for instance: a number input). You can add your own types in several different ways as shown on this page.

## Builtin Types
Right now PNE is mostly only capable of handling `int`,`float`,`str` and unions of those types. However please see how you can create user models below and custom types below.

## Union Types
A function argument annotated with a union type can be displayed by the frontend as long as both types have display support:
```python
def add_with_union(a: int | float, b: int) -> float:
    return a + b
```
Running PNE on it: `uv run pne examples/union_args.py` ([examples/union_args.py](../examples/union_args.py)) will result in a small menu being added to the respective input in the frontend, which allows you to choose which input component you want to use based on the types allowed by the union. The default input component is the first type defined in the union. Note that the older `Union[int, float]` definition will also work. 

<img alt="localhost_8000_ (6).png" src="images/localhost_8000_ (6).png">


## User Model Types
PNE uses [pydantic](https://docs.pydantic.dev/latest/) data models for serialziation/validation hooks and defining it's own internal schemas. If you create a pydantic-style class using the provided *UserModel* class and use it in a function type annotation, the code analysis in PNE will automatically create nodes to construct and deconstruct instances of the model. This allows you to create named data structures and pass them around as a new type and query their fields without writing frontend code.

[user_model.py](../examples/user_model.py) - Run with `uv run pne examples/user_model.py`
```python
from python_node_editor.schema import UserModel

class Point2D(UserModel):
    x: float
    y: float

def two_point_distance(a: Point2D, b: Point2D) -> float:
    """Calculates the distance between two 2D points."""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
```
Run the frontend and navigate to the types display on the left side. You will see that PNE detected your user model since it was used in type annotation of the function defined in the file. The green dot shows that the frontend has the correct components to display it. 

<img alt="localhost_8000_ (8).png" src="images/localhost_8000_ (8).png">


Also note that in the nodes panel, there are an extra two nodes with an `auto` flag. These nodes were created automatically upon the detection of the `Point2D` user model, and can be used to construct the model from it's field values, or deconstruct the model into it's field values in order to access them as a normal value. Usage is as shown below to get the hypotenuse length of a 3-4-5 right triangle:

<img alt="localhost_8000_ (7).png" src="images/localhost_8000_ (7).png">
    
# Cached Data Types

Let's say you want to work with large data. This could be big images, spreadsheet-style data, numpy arrays, SVGs, etc. PNE has a frontend and backend and it needs to send inputs to the backend and outputs back to the frontend. With large data that's a lot of (potentially slow) back and forth.

To help with this PNE provides some utilities for caching data in the backend and sending only previews (or thumbnails, etc) to the frontend.

To enable this from the your python function you can use the `add_node_options` decorator whose other functions are described in [Node-Customization](https://github.com/tristanryerparke/python-node-editor/wiki/Node-Customization). 

The large data will still be uploaded to the backend via the frontend, but cached data is designed so that upload only happens once and later graph execution passes cache-key references.

The core backend expects cached-type handlers such as:

- `deserializer(payload: dict) -> tuple[value, metadata_dict]`
- `metadata_generator(value) -> dict` (optional, used to attach preview/display metadata)
- `reference_model`, a small Pydantic model sent back to the frontend

Rich frontend display for a cached type is now supplied by plugins. For example, `pne-plugin-image` owns Pillow support, the `Image` cached handler, and the Image input/output renderers. A user project can install it and use:

```python
from PIL import ImageFilter
from PIL.Image import Image
from python_node_editor.plugins.image import image_cached_datatype


@image_cached_datatype
def blur_image(image: Image, radius: int = 40) -> Image:
    return image.filter(ImageFilter.GaussianBlur((radius, radius)))
```

The core package remains generic; plugin packages register any type-specific serializers, renderers, and backend cached-data handlers.
