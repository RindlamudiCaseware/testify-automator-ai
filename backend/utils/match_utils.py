# utils/match_utils.py
import difflib
import re
import os
from urllib.parse import urlparse

def find_best_match(target: str, ocr_entries: dict, threshold=0.8):
    best_score = 0
    best_id = None
    for entry_id, text in ocr_entries.items():
        score = difflib.SequenceMatcher(None, target.lower(), text.lower()).ratio()
        if score > threshold and score > best_score:
            best_score = score
            best_id = entry_id
    return best_id

def normalize_text(text: str) -> str:
    """
    Normalize text for embedding comparison.
    """
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)  # remove punctuation
    text = re.sub(r'\s+', ' ', text)     # collapse whitespace
    return text

def normalize_page_name(input_string: str) -> str:
    input_string = input_string.strip().lower()

    if input_string.startswith("http"):
        parsed = urlparse(input_string)
        domain = parsed.hostname.replace("www.", "").split('.')[0]  # 🛠 strip to `saucedemo`
        path = parsed.path.strip("/")
        page = path.replace(".html", "").replace("/", "_") or "login"
        return f"{domain}_{page}"

    if input_string.endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp")):
        base = re.sub(r'\.(png|jpg|jpeg|bmp|gif|webp)$', '', input_string)
        return base.lower()

    return input_string
