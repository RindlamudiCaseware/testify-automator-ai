import pytesseract
from PIL import Image
import uuid
from utils.file_utils import save_region
from services.chroma_service import upsert_text_record
from config.settings import DATA_PATH
from typing import List, Optional
import os
from utils.match_utils import normalize_page_name

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\RajeshIndlamudi\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

def sanitize_metadata(record: dict) -> dict:
    return {k: (str(v) if v is not None and not isinstance(v, (dict, list)) else "" if v is None else str(v)) for k, v in record.items()}

async def process_image(image: Image.Image, filename: str, page_name: Optional[str] = None, base_folder: Optional[str] = None) -> List[dict]:
    """
    Patched function to enforce same page_name as locators!
    Now explicitly accepts `page_name`, fallback to filename if not provided.
    """
    page_name = normalize_page_name(filename)  

    # if page_name is None:
    #     page_name = os.path.splitext(os.path.basename(filename))[0]
    
    # ✅ normalize page_name to match locator naming convention
    # if not page_name.startswith("www_"):
    #     page_name = f"www_{page_name}"

    print(f"[DEBUG] Final OCR page_name = '{page_name}' (from filename='{filename}')")

    image_dir = os.path.join(DATA_PATH, "images")
    os.makedirs(image_dir, exist_ok=True)
    image_save_path = os.path.join(image_dir, filename)
    image.save(image_save_path)

    regions_dir = os.path.join(DATA_PATH, "regions")
    os.makedirs(regions_dir, exist_ok=True)

    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    results = []

    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        if not text:
            continue

        x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]

        region_img_path = save_region(image=image, x=x, y=y, w=w, h=h, output_dir=regions_dir, page_name=page_name)

        unique_id = str(uuid.uuid4())

        record = {
            "id": unique_id,
            "ocr_id": unique_id,
            "type": "ocr",
            "page_name": page_name,   # ✅ key point → normalized page_name
            "source_type": "image",
            "text": text,
            "bbox": f"{x},{y},{w},{h}",
            "region_image_path": region_img_path,
            "xpath": "",
            "get_by_text": "",
            "get_by_role": "",
            "intent": "",
            "html_snippet": "",
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "confidence_score": 1.0,
            "visibility_score": 1.0,
            "locator_stability_score": 1.0,
            "used_in_tests": "[]",
            "last_tested": "",
            "healing_success_rate": 0.0,
            "snapshot_id": "",
            "match_timestamp": ""
        }

        sanitized_record = sanitize_metadata(record)

        try:
            upsert_text_record(sanitized_record)
            results.append(sanitized_record)
            print(f"[DEBUG] Inserted OCR record for text='{text}', page_name='{page_name}', id='{unique_id}'")
        except Exception as e:
            print(f"⚠️ Skipping {filename} entry {unique_id}: {e}")

    return results
