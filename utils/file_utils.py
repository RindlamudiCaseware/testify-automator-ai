import os
from PIL import Image
from datetime import datetime

def save_region(image: Image.Image, x: int, y: int, w: int, h: int, output_dir: str, page_name: str = "page") -> str:
    # Crop the region
    cropped = image.crop((x, y, x + w, y + h))

    # Timestamp for uniqueness
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")

    # Build filename with context: page, coords, timestamp
    filename = f"{page_name}_{x}_{y}_{w}_{h}_{timestamp}.png"
    region_path = os.path.join(output_dir, filename)

    # Save image
    cropped.save(region_path)
    return region_path
