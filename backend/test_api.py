import requests
import time

url = "http://localhost:8000/"

# Trigger the execution
execution_response = requests.get(url + "execute_test")
if execution_response.status_code == 200:
    print("Execution started.")
else:
    print("Failed to start execution.")
    exit(1)

# # Poll for status and stream
# while True:
#     # Check the current status
#     status_response = requests.get(url + "status")
#     if status_response.status_code == 200:
#         status_data = status_response.json()
#         print(f"Current node: {status_data.get('current_node', 'Unknown')}")
#         if status_data.get('stream') is not None:
#             print(f"Stream data: {status_data.get('stream')}")
#         if status_data.get('current_node') is None:
#             break

#     time.sleep(2)  # Wait for 2 seconds before polling again