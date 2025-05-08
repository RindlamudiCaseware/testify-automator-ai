import difflib

def find_best_match(target: str, ocr_entries: dict, threshold=0.8):
    best_score = 0
    best_id = None
    for entry_id, text in ocr_entries.items():
        score = difflib.SequenceMatcher(None, target.lower(), text.lower()).ratio()
        if score > threshold and score > best_score:
            best_score = score
            best_id = entry_id
    return best_id