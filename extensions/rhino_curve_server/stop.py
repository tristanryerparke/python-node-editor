#! python3
import scriptcontext as sc

STICKY_STATE_KEY = "python_node_editor.rhino_curve_server.worker_state"


def main():
    stop = sc.sticky.get(STICKY_STATE_KEY)
    if not callable(stop):
        print(
            {
                "status": "not_running",
                "message": "No shared Rhino curve server state found",
            }
        )
        return

    stop()


if __name__ == "__main__":
    main()
