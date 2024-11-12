import os
import subprocess
import shutil
import json
import redis
import time

def get_full_path(filename):
    '''Returns the full path of a file in the current working directory'''
    cwd = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(cwd, filename)
    return os.path.abspath(full_path)

def copy_to_home(filename):
    '''Copys a file to the home directory'''

    home_dir = os.path.expanduser("~")
    original_path = get_full_path(filename)
    dest_path = os.path.join(home_dir, filename)
    shutil.copy2(original_path, dest_path)
    return dest_path

def get_polyline():
    '''Gets a 2d polyline from Rhino'''
    RHINOCODE_PATH = r'/Applications/Rhino 8.app/Contents/Resources/bin/rhinocode'

    # FIXME Is this a dropbox/fileprovider problem?
    home_script_path = copy_to_home('get_polyline.py')

    cmd = [RHINOCODE_PATH, 'script', home_script_path]

    # Init Redis and delete the 'get_polyline' key
    r = redis.Redis(host='127.0.0.1', port=6379)
    r.delete('get_polyline')

    # Run the Rhino script
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode != 0:
        print("Error running Rhino script:")
        print(process.stderr)
        return None
    # Wait until the 'get_polyline' key exists in Redis (with timeout)
    timeout = 30  # seconds
    start_time = time.time()
    while not r.exists('get_polyline'):
        if time.time() - start_time > timeout:
            print("Timeout waiting for 'get_polyline' key in Redis")
            raise Exception("Timeout waiting for 'get_polyline' key in Redis")
        time.sleep(0.1)

    
    return json.loads(r.get('get_polyline'))

def get_polyline_redis(redis_key: str):
    r = redis.Redis(host='127.0.0.1', port=6379)

    return json.loads(r.get(redis_key))

# Example usage
if __name__ == "__main__":
    polyline = get_polyline()
    if polyline:
        print("Parsed polyline points:")
        print(polyline)
    else:
        print("Failed to get polyline")
