# Python Node Editor

This app aims be a general visual framework for running your python code. I've worked with Rhino/Grasshopper for many years and enjoyed that interface, but there are times when you need the runtime to be a little more geared toward your personal use case. My original use was similar to grasshopper, working with polylines and eventually g-code postprocessing. However I needed more flexiblity when handling lists, and class-like data structures. 

I tried hacking many different options: Ryven, Chainner, ComfyUI, Langflow, etc. Nothing seemed to be designed quite for what I wanted to do. 

The important things about python-node-editor are the following:
- Robust support for nodes to stream data and progress info to the frontend via generators.
- Buttons for direct access to the source code on each node.
- Saving of flows with embedded (even large) data.