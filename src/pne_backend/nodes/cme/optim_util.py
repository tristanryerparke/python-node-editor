import requests
from PIL import Image
import base64
import io
from math import sqrt

class StrokeOptim:
    def __init__(self, url, api_key):
        self.url = url
        self.api_key = api_key
        self.job_id = None

    def run(
        self, 
        image: Image,
        physical_size_in, 
        num_strokes=1500,
        num_steps=25,
        width_scale=3,
        length_scale=0.75,
        style_weight=0,
        tv_weight=0.01,
        curvature_weight=0
    ):
        MAX_PIXELS = 900000
        
        # Resize the image
        original_width, original_height = image.size
        scaling_factor = min(1, sqrt(MAX_PIXELS / (original_width * original_height)))
        new_width = int(original_width * scaling_factor)
        new_height = int(original_height * scaling_factor)
        img_resized = image.resize((new_width, new_height)).convert('RGB')

        # Convert to base64 string
        buffered = io.BytesIO()
        img_resized.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        # Prepare request data
        request_data = {
            "request_type": "base64",
            "current_job": {
                "width_in": physical_size_in[0],  # Convert mm to inches
                "height_in": physical_size_in[1],  # Convert mm to inches
            },
            "num_steps": num_steps,
            "num_strokes": num_strokes,
            "width_scale": width_scale,
            "length_scale": length_scale,
            "style_weight": style_weight,
            "tv_weight": tv_weight,
            "curvature_weight": curvature_weight,
            "image": img_str,
        }

        try:
            headers = {'Authorization': f"Bearer {self.api_key}"}
            response = requests.post(f"{self.url}/run", json={"input": request_data}, headers=headers)
            response.raise_for_status()
            self.job_id = response.json()['id']
            return self.job_id
        except requests.RequestException as error:
            print(f"Error submitting job: {error}")
            raise

    def status(self):
        if not self.job_id:
            raise ValueError("No job has been submitted. Call run() first.")
        
        try:
            headers = {'Authorization': f"Bearer {self.api_key}"}
            response = requests.get(f"{self.url}/status/{self.job_id}", headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as error:
            print(f"Error fetching status: {error}")
            raise

    def result(self):

        if not self.job_id:
            raise ValueError("No job has been submitted. Call run() first.")
        
        status = None
        iteration_status = None  # Initialize iteration_status outside the loop
        while True:
            response = self.status()
            if response['status'] != status:
                print(f"Status: {response['status']}")
                status = response['status']

            if 'output' in response:
                update = response['output']
                if update != iteration_status:
                    iteration_status = update
                    # print(iteration_status)

            if response['status'] == 'COMPLETED':
                break

        results = response['output']
        svg_encoded = results['svg']
        
        # Remove the 'b' prefix and quotes from the string
        svg_encoded = svg_encoded.strip("b'")
        
        # Decode the base64 string
        svg = base64.b64decode(svg_encoded).decode('utf-8')
        
        # Remove the namespace prefix
        svg = svg.replace('ns0:', '').replace('xmlns:ns0', 'xmlns')
        return svg
    