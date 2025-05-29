import os
from PIL import Image
from datetime import datetime
from utils.match_utils import assign_intent_semantic

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


def build_standard_metadata(element: dict, page_name: str, image_path: str = "", source_url: str = "") -> dict:
    # Extract label
    label_text = element.get("label_text") or element.get("text", "")
    
    # Auto assign intent if not already set
    intent = element.get("intent", "")
    if not intent and label_text:
        try:
            intent = assign_intent_semantic(label_text)
        except Exception as e:
            print(f"[WARN] Failed to assign intent for '{label_text}': {e}")
            intent = ""

    return sanitize_metadata({
        "id": element.get("id") or element.get("ocr_id") or element.get("element_id", ""),
        "ocr_id": element.get("ocr_id") or element.get("id") or element.get("element_id", ""),
        "page_name": page_name,
        "text": element.get("text") or label_text,
        "label_text": label_text,
        "x": element.get("x", element.get("boundingBox", {}).get("x", 0)),
        "y": element.get("y", element.get("boundingBox", {}).get("y", 0)),
        "width": element.get("width", element.get("boundingBox", {}).get("width", 0)),
        "height": element.get("height", element.get("boundingBox", {}).get("height", 0)),
        "confidence_score": element.get("confidence_score", 1.0),
        "visibility_score": element.get("visibility_score", 1.0),
        "locator_stability_score": element.get("locator_stability_score", 1.0),
        "used_in_tests": element.get("used_in_tests", []),
        "last_tested": element.get("last_tested", ""),
        "healing_success_rate": element.get("healing_success_rate", 0.0),
        "snapshot_id": element.get("snapshot_id", ""),
        "match_timestamp": element.get("match_timestamp", ""),
        "region_image_path": image_path,
        "source_url": source_url,
        "bbox": element.get("bbox", f"{element.get('x', 0)},{element.get('y', 0)},{element.get('width', 0)},{element.get('height', 0)}"),
        "position_relation": element.get("position_relation", {}),
        "tag_name": element.get("tag_name", ""),
        "xpath": element.get("xpath", ""),
        "get_by_text": element.get("get_by_text", ""),
        "get_by_role": element.get("get_by_role", ""),
        "intent": intent,  # ✅ Automatically inferred intent
        "html_snippet": element.get("html_snippet", ""),
        "dom_matched": element.get("dom_matched", False),
    })


def sanitize_metadata(metadata: dict) -> dict:
    """Ensure all values are primitive types acceptable by ChromaDB."""
    def safe_convert(value):
        if isinstance(value, (str, int, float, bool)):
            return value
        if value is None:
            return ""
        if isinstance(value, (dict, list)):
            return str(value)
        return str(value)
    return {k: safe_convert(v) for k, v in metadata.items()}