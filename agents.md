1. Summary of what the repo does:
Python Node Editor (PNE) turns type-annotated Python functions into a node-graph web UI, so users can run and chain functions without building a custom frontend. The backend analyzes function signatures, docstrings, and models, then serves execution endpoints; the frontend renders nodes, ports, inputs, and async execution updates. It supports builtin scalar types, unions, Pydantic-based UserModel auto constructor/deconstructor nodes, and MultipleOutputs models for multi-port returns. add_node_options customizes node labels, return names, and large-data caching handlers (for previews/metadata). Typical workflows use uv run pne ...; pne-backend plus Bun dev server enables frontend development, while prebuilt frontend is shipped for normal usage cases. You can find the appropriate cli commands in `pyproject.toml`.



5. When creating tests for function analysis use this file as a reference for how to write the assertions: tests/function_analysis_testing/test_basic_functions.py


6. If you need information on how the backend's analysis works, you can use the app's cli to run the backend analysis functions like so: uv run pne-analyze examples/basic_dynamic_inputs.py -v

7. I'm using Pydantic V2 in this project.
