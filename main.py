"""Usually we run the backend via it's uv cli tool, but this file lets us run it with debugpy"""

if __name__ == "__main__":
    from python_node_editor.cli import backend_only

    backend_only()
