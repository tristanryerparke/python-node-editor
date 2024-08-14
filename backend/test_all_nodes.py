import requests
import time

url = "http://localhost:8000/"


nodes_response = requests.get(url + "all_nodes").json()
print(nodes_response)