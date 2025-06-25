from chromadb import PersistentClient
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Any
from datetime import datetime
from playwright.async_api import Page
from utils.file_utils import build_standard_metadata



# 🔧 Embedding setup
embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
text_model = SentenceTransformer("all-MiniLM-L6-v2")

# 🔧 Persistent ChromaDB
client = PersistentClient(path="./data/chroma_db")
collection = client.get_or_create_collection(
    name="element_metadata",
    embedding_function=embedding_fn
)

# 🧠 Memory store
CURRENT_PAGE_NAME = None
LAST_MATCHED_RESULTS = []

def set_page_name(name: str):
    global CURRENT_PAGE_NAME
    CURRENT_PAGE_NAME = name
    print(f"✅ Page name set to: {CURRENT_PAGE_NAME}")

def get_page_name() -> str:
    return CURRENT_PAGE_NAME

def set_last_match_result(data):
    global LAST_MATCHED_RESULTS
    LAST_MATCHED_RESULTS = data

def get_last_match_result():
    return LAST_MATCHED_RESULTS

# ✅ Normalize bbox input
def bbox_distance(b1, b2) -> float:
    if isinstance(b1, str):
        try:
            x, y, w, h = map(int, b1.split(','))
            b1 = {"x": x, "y": y, "width": w, "height": h}
        except Exception as e:
            print(f"[❌] Invalid bbox string: {b1} — Error: {e}")
            return float('inf')
    return np.sqrt((b1['x'] - b2['x'])**2 + (b1['y'] - b2['y'])**2)

# ✅ Text similarity
def text_similarity(t1: str, t2: str) -> float:
    vecs = text_model.encode([t1, t2], show_progress_bar=False)
    return float(cosine_similarity([vecs[0]], [vecs[1]])[0][0])

# ✅ Extract DOM metadata from page
async def extract_dom_metadata(page: Page, page_name: str) -> List[Dict[str, Any]]:
    if page.is_closed():
        print("[❌] Attempted to access a closed page.")
        return []

    # elements = await page.locator("body *").all()
    # This selector matches all elements under <body> EXCEPT anything inside #ocrModal
    elements = await page.locator("body *:not(#ocrModal *):not(#ocrModal)").all()

    print("[DEBUG] Got all locator from dom except ocrModal")
    print(f"[DEBUG] DOM ELEMENTS <= logic/manual_capture_mode.py")
    
    output_lines = []
    output_lines.append(f"[DEBUG] DOM ELEMENTS <= logic/manual_capture_mode.py")
    for i, elem in enumerate(elements):
        try:
            tag = await elem.evaluate("e => e.tagName") if elem else None
            text = await elem.evaluate("e => e.textContent") if elem else None
            elem_id = await elem.get_attribute("id")
            elem_class = await elem.get_attribute("class")
            placeholder = await elem.get_attribute("placeholder")
            input_type = await elem.get_attribute("type") if tag and tag.lower() == "input" else None
            attrs = await elem.evaluate("e => { let a = {}; for (let attr of e.attributes) { a[attr.name] = attr.value; } return a; }")
            value = attrs.get('value')
            outer_html = await elem.evaluate("e => e.outerHTML") if elem else None
            visible = await elem.is_visible()
            enable = await elem.is_enabled()

            editable = False
            if tag and tag.lower() in ("input", "textarea", "select"):
                editable = await elem.is_editable()
            else:
                contenteditable = await elem.get_attribute("contenteditable")
                if contenteditable == "true":
                    editable = await elem.is_editable()
                                
            element_lines = [
                f"Element {i+1}:",
                f"  page_name:      {page_name}",
                f"  tag_name:       {tag}",
                f"  text:           {text.strip() if text else ''}",
                f"  id:             {elem_id if elem_id else '[none]'}",
                f"  class:          {elem_class if elem_class else '[none]'}",
                f"  value:          {value}",
                f"  placeholder:    {placeholder if placeholder else '[none]'}",
                f"  type:           {input_type if input_type else '[none]'}",
                f"  attributes:     {attrs}",
                f"  enable?         {enable}",
                f"  visible?        {visible}",
                f"  editable?       {editable}",
                f"  HTML:           {outer_html[:120]}{'...' if outer_html and len(outer_html) > 120 else ''}",
                "-" * 60
            ]
            output_lines.extend(element_lines)
        except Exception as e:
            output_lines.append(f"[⚠️] Skipping element {i+1} due to error: {e}")
            continue

    # Write all info to a file
    from pathlib import Path
    debug_metadata_dir = Path("generated_runs") / "src" / "ocr-dom-metadata"
    debug_metadata_dir.mkdir(parents=True, exist_ok=True)
    out_file = debug_metadata_dir / f"dom_elements_{page_name}.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"[INFO] DOM extracted element data saved to {out_file}")


    data = []
        
    for element in elements:
        try:
            # tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
            bounding_box = await element.bounding_box()
            # text = (await element.text_content() or "").strip()
            # placeholder = await element.get_attribute("placeholder") or ""
            # placeholder = placeholder.strip()

            tag = (await elem.evaluate("e => e.tagName.toLowerCase()") or '').strip() if elem else None
            text = (await elem.evaluate("e => e.textContent") or '').strip() if elem else None
            elem_id = (await elem.get_attribute("id") or '').strip()
            elem_class = (await elem.get_attribute("class") or '').strip()
            placeholder = (await elem.get_attribute("placeholder") or '').strip()
            input_type = await elem.get_attribute("type") if tag and tag.lower() == "input" else None
            attrs = await elem.evaluate("e => { let a = {}; for (let attr of e.attributes) { a[attr.name] = attr.value; } return a; }")
            value = attrs.get('value') or None
            # outer_html = await elem.evaluate("e => e.outerHTML") if elem else None
            visible = await elem.is_visible()
            enable = await elem.is_enabled()
            editable = False
            if tag and tag.lower() in ("input", "textarea", "select"):
                editable = await elem.is_editable()
            else:
                contenteditable = await elem.get_attribute("contenteditable")
                if contenteditable == "true":
                    editable = await elem.is_editable()
            
            if not tag or not bounding_box or text or placeholder:
                continue


            data.append({
                    "page_name": page_name,
                    "tag_name": tag,
                    "text": text,
                    "id": elem_id,
                    "class": elem_class,
                    "value": value,
                    "placeholder": placeholder,
                    "type": input_type,
                    "attributes": attrs,
                    "enable": enable,
                    "visible": visible,
                    "editable": editable,
                    "x": bounding_box["x"],
                    "y": bounding_box["y"],
                    "width": bounding_box["width"],
                    "height": bounding_box["height"]
                })

        except Exception as inner_error:
            print(f"[⚠️] Skipping element due to error: {inner_error}")
            continue
    print("[DEBUG] DOM DATA: ", data)
    return data


# ✅ Match and update OCR data with DOM data
# def match_and_update(ocr_data, dom_data, collection, text_thresh=0.5, bbox_thresh=300):
#     global LAST_MATCHED_RESULTS
#     matched_records = []

#     print(f"[DEBUG] Matching {len(ocr_data)} OCRs with {len(dom_data)} DOMs")

#     for ocr in ocr_data:
#         if not ocr.get("text") or not ocr.get("bbox"):
#             print(f"[SKIP] OCR missing text or bbox: {ocr}")
#             continue

#         best_match = None
#         best_score = 0.0

#         if isinstance(ocr["bbox"], str):
#             print(f"[DEBUG] Parsing bbox string: {ocr['bbox']}")

#         for dom in dom_data:
#             if not dom.get("text"):
#                 continue

#             sim = text_similarity(ocr["text"].lower(), dom["text"].lower())
#             dist = bbox_distance(ocr["bbox"], {"x": dom["x"], "y": dom["y"]})

            # print(f"[CHECK] '{ocr['text']}' vs '{dom['text']}' | sim={sim:.2f} dist={dist:.1f}")

#             if sim >= text_thresh and dist <= bbox_thresh and sim > best_score:
#                 best_match = dom
#                 best_score = sim

#         if best_match:
#             updated = ocr.copy()
#             updated.update({
#                 "tag_name": best_match.get("tag_name", ""),
#                 "x": best_match.get("x", ""),
#                 "y": best_match.get("y", ""),
#                 "width": best_match.get("width", ""),
#                 "height": best_match.get("height", ""),
#                 "dom_matched": True,
#                 "match_timestamp": datetime.utcnow().isoformat()
#             })

#             collection.upsert(
#                 ids=[updated["id"]],
#                 documents=[updated["text"]],
#                 metadatas=[updated],
#             )
#             matched_records.append(updated)

#     LAST_MATCHED_RESULTS = matched_records
#     print(f"[DEBUG] Final matched_records = {len(matched_records)}")
#     return matched_records


# from concurrent.futures import ThreadPoolExecutor  
# from datetime import datetime
# import time
# def match_and_update(ocr_data, dom_data, collection, text_thresh=0.5, bbox_thresh=300):
#     global LAST_MATCHED_RESULTS
#     matched_records = []
 
#     print(f"[DEBUG] Matching {len(ocr_data)} OCRs with {len(dom_data)} DOMs")
#     # print(dom_data)
 
#     start_time = time.time()
 
#     def match_single_ocr(ocr):  
#         if not ocr.get("text") or not ocr.get("bbox"):
#             # print(f"[SKIP] OCR missing text or bbox: {ocr}")
#             return None
 
#         best_match = None
#         best_score = 0.0
 
#         for dom in dom_data:
#             dom_text = dom.get("text", "") or dom.get("placeholder", "")  
#             if not dom_text.strip():
#                 continue
 
#             sim = text_similarity(ocr["text"].lower(), dom_text.lower())
#             dist = bbox_distance(ocr["bbox"], {"x": dom["x"], "y": dom["y"]})
 
#             print(f"[CHECK] '{ocr['text']}' vs '{dom_text}' | sim={sim:.2f} dist={dist:.1f}")
 
#             if sim >= text_thresh and sim > best_score:
#                 best_match = dom
#                 best_score = sim
 
#         if best_match:
#             updated = ocr.copy()
#             updated.update({
#                 "tag_name": best_match.get("tag_name", ""),
#                 "x": best_match.get("x", ""),
#                 "y": best_match.get("y", ""),
#                 "width": best_match.get("width", ""),
#                 "height": best_match.get("height", ""),
#                 "placeholder": best_match.get("placeholder", ""),
#                 "dom_matched": True,
#                 "match_timestamp": datetime.utcnow().isoformat()
#             })
#             return updated
 
#         return None
 
#     with ThreadPoolExecutor(max_workers=8) as executor:  
#         results = list(executor.map(match_single_ocr, ocr_data))  
 
#     for updated in results:  
#         if updated:
#             collection.upsert(
#                 ids=[updated["id"]],
#                 documents=[updated["text"]],
#                 metadatas=[updated],
#             )
#             matched_records.append(updated)
 
#     LAST_MATCHED_RESULTS = matched_records
 
#     end_time = time.time()
#     print(f"[⏱️] Matching completed in {end_time - start_time:.2f} seconds")
#     print(f"[DEBUG] Final matched_records = {len(matched_records)}")
#     return matched_records



def match_and_update(ocr_data, dom_data, collection, text_thresh=0.5, bbox_thresh=300):
    global LAST_MATCHED_RESULTS
    matched_records = []

    print(f"[DEBUG] Matching {len(ocr_data)} OCRs with {len(dom_data)} DOMs")

    for ocr in ocr_data:
        if not ocr.get("label_text") or not ocr.get("bbox"):
            print(f"[SKIP] OCR missing label_text or bbox: {ocr}")
            continue

        ocr_text = ocr["label_text"].strip().lower()
        best_match = None
        best_score = 0.0

        for dom in dom_data:
            
            dom_text = dom.get("text", "") or dom.get("placeholder", "") or dom.get("value")
            # dom_text = dom.get("text", "")
            # if not dom_text.strip():
            #     dom_text = dom.get("placeholder", "")

                        
            if not dom_text:
                continue

            sim = text_similarity(ocr["text"].lower(), dom_text.lower())

            if sim >= text_thresh and sim > best_score:
                best_match = dom
                best_score = sim
                

        if best_match:
            updated = ocr.copy()
            updated.update({
                "tag_name": best_match.get("tag_name", ""),
                "text": best_match.get("text", ""),
                "id": best_match.get("id", ""),
                "class": best_match.get("class", ""),
                "value": best_match.get("value", ""),
                "placeholder": best_match.get("placeholder", ""),
                "type": best_match.get("type", ""),
                "attributes": best_match.get("attributes", ""),
                "enable": best_match.get("enable", ""),
                "visible": best_match.get("visible", ""),
                "editable": best_match.get("editable", ""),
                
                "x": best_match.get("x", ""),
                "y": best_match.get("y", ""),
                "width": best_match.get("width", ""),
                "height": best_match.get("height", ""),
                "dom_matched": True,
                "match_timestamp": datetime.utcnow().isoformat()
            })

            collection.upsert(
                ids=[updated["id"]],
                documents=[updated["label_text"]],
                metadatas=[updated],
            )
            matched_records.append(updated)

    LAST_MATCHED_RESULTS = matched_records
    print(f"[✅] Matched {len(matched_records)} elements.")
    return matched_records
