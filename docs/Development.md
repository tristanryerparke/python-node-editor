PNE is designed to consume your python code and generate a node-based frontend for it. But PNE can also be modified (usually frontend modifications to enhance the display of custom types, etc). 

The methods here use `bun` for frontend development and build but `npm` should also work.

The normal command `uv run pne my_file.py` serves a static prebuilt version of the frontend stored in `src/python_node_editor/prebuilt_frontend`. This prevents normal users from needing the ram and development tools to build the frontend. 

You can also run only the backend by running `uv run pne-backend my_file.py`, and then in a seperate terminal run `cd frontend && bun run dev` to start a development server with live reloading for the frontend. Note that this will run the frontend on a different port than the backend, but data flow should work out of the box.

If you want to run a modified frontend in production mode you can add the `-bf` or `--build-frontend` to the above command to rebuild and serve the static frontend on the normal port. Observe that running `uv run pne examples/basic_percentage.py -bf` results in:
```
Frontend: Build complete!
Frontend available at: http://127.0.0.1:8000
INFO:     Started server process [96062]
INFO:     Waiting for application startup.
Found 1 functions and 2 types
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

There is also a frontend build utility script available at [build-frontend.sh](../scripts/build-frontend.sh) that is used to build the frontend for production.
