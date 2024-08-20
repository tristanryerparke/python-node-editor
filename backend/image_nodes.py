from typing import Tuple, Union, Dict
# add base_node file to path
from functools import lru_cache
from PIL import Image, ImageFilter
import sys
import time
import base64
sys.path.append('./')
from base_node import BaseNodeData, StreamingBaseNodeData


MAXSIZE = 10

class LoadImageFile(BaseNodeData):
    outputs: dict = {'image': None}
    
    @classmethod
    @lru_cache(maxsize=MAXSIZE)
    def exec(
        cls, 
        image_path: str,
    ) -> Dict[str, Union[float, int]]:
        return {'image': Image.open(image_path).convert('RGB')}
    
    def model_dump(self, *args, **kwargs):
        if self.outputs['image'] is not None:
            self.outputs['image'] = base64.b64encode(self.outputs['image'].tobytes()).decode('utf-8')

        return super().model_dump(*args, **kwargs)
        

class BlurImage(BaseNodeData):
    outputs: dict = {'image': None}
    
    @classmethod
    def exec(
        cls, 
        image: Image,
        radius: int,
    ) -> Union[float, int]:
        return {'image': image.filter(ImageFilter.GaussianBlur(radius=radius))}
    
    def model_dump(self, *args, **kwargs):
        if self.outputs['image'] is not None:
            self.outputs['image'] = base64.b64encode(self.outputs['image'].tobytes()).decode('utf-8')
        return super().model_dump(*args, **kwargs)
    
class SaveImage(BaseNodeData):
    outputs: dict = {'image_path': None}
    
    @classmethod
    def exec(
        cls, 
        image: Image,
        image_path: str,
    ) -> Dict[str, Union[float, int]]:
        image.save(image_path)
        return {'image_path': image_path}
    
    def model_dump(self, *args, **kwargs):
        if self.outputs['image'] is not None:
            self.outputs['image'] = base64.b64encode(self.outputs['image'].tobytes()).decode('utf-8')
        return super().model_dump(*args, **kwargs)