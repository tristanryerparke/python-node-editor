# Python Node Editor

This app aims be a general visual framework for running your python code. I've worked with Rhino/Grasshopper for many years and enjoyed that interface, but there are times when you need the runtime to be a little more geared toward your personal use case. My original use was similar to grasshopper, working with polylines and eventually g-code postprocessing. However I needed more flexiblity when handling lists, and class-like data structures. 

I tried hacking many different options: Ryven, Chainner, ComfyUI, Langflow, etc. Nothing seemed to be designed quite for what I wanted to do. 

The important things about python-node-editor are the following:
- Robust support for nodes to stream data and progress info to the frontend via generators.
- Buttons for direct access to the source code on each node.
- Saving of flows with embedded (even large) data.

# Setup:

Requirements:
- conda / venv @ python 3.12
- npm / bun

Steps:
- clone the repo
- `python -m pip install .`
- `cd frontend && bun install (or npm install)`

# Running:
- `python -m pne_backend.main`
- `cd frontend && bun run dev` or `cd frontend && npm run dev`




# Profile with:
`tuna execution_profile.pstat`



plans:

on a node, there are inputs and outputs

each input and output has a list of data types that it can accept (like a union type)

if the data type is not accepted, the input will be highlighted in red and the execution is blocked

Every bit of data that be sent into a node will be one of the following types:
- Basic Data Types: IntData, FloatData, StringData, BoolData, ImageData
- ListData (contains Basic Data Types or nested ListData, ModelData)
- ModelData (contains Basic Data Types or nested ListData, ModelData)

These basic types will be defined in both python and typescript, and typescript should be able to validate the data so that it won't be invalid in the backend.

Validation will happen when users change the input. For instance, a number input where you delete the number and remove focus from the input field will be invalid.

When a user is inputting data on a node field, the callback function will only be called if a valid instance of the data type is created. This could mean only when a valid integer is entered, or an image is uploaded.


