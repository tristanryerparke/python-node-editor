
import subprocess
import os
import sys
import webview
import time

if __name__ == "__main__":

    def on_closed():
        print("Window is closing. Shutting down...")
        sys.exit(0)

    # Start the frontend as a non-blocking subprocess
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    frontend_process = subprocess.Popen(['bun', 'run', 'dev'], cwd=frontend_path)

    # Start the backend as a non-blocking subprocess
    backend_process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'])

    # Give some time for the processes to start
    time.sleep(1)

    # Create and start the webview
    window = webview.create_window(
        'Python Node Editor', 
        'http://localhost:5173/', 
        width=1920, 
        height=1080,
        background_color='#000000',
        transparent=True,
        resizable=True,
        # frameless=True,
        vibrancy=True,
        easy_drag=False
    )
    window.events.closed += on_closed
    webview.start(debug=True)

    # Clean up subprocesses
    frontend_process.terminate()
    backend_process.terminate()