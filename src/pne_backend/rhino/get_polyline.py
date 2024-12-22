# r: redis

import rhinoscriptsyntax as rs
import json
import redis

    # Round all points to the nearest N (default is 2)
def round_points(points, n=2):
    return [[round(coord, n) for coord in point] for point in points]

# Get the polyline from the user
poly = rs.GetPolyline()

# Extract 2D points from the polyline
pts_list = round_points([[pt.X, pt.Y] for pt in poly])

# Add the polyline to the Rhino document
id = rs.AddPolyline(poly)


key = rs.GetString('Enter a key for the polyline in Redis')

# Connect to Redis
r = redis.Redis(host='127.0.0.1', port=6379)

# Convert the points list to JSON
json_data = json.dumps(pts_list)

# Send the JSON data to Redis under the key 'get_polyline'
r.set(key, json_data)

print("Polyline points sent to Redis server.")
