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
    vecs = text_model.encode([t1, t2])
    return float(cosine_similarity([vecs[0]], [vecs[1]])[0][0])

# ✅ Extract DOM metadata from page
async def extract_dom_metadata(page: Page, page_name: str) -> List[Dict[str, Any]]:
    if page.is_closed():
        print("[❌] Attempted to access a closed page.")
        return []

    elements = await page.locator("body *").all()
    data = []
        
    for element in elements:
        try:
            if await element.is_visible():
                tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
                bounding_box = await element.bounding_box()

                if not tag_name or not bounding_box:
                    continue

                text = (await element.text_content() or "").strip()
                placeholder = await element.get_attribute("placeholder") or ""
                placeholder = placeholder.strip()

                final_text = text if text else placeholder
                if not final_text:
                    continue

                data.append({
                    "page_name": page_name,
                    "tag_name": tag_name,
                    "text": text,
                    "value": await element.get_attribute("value") or "",
                    "placeholder": placeholder,
                    "x": bounding_box["x"],
                    "y": bounding_box["y"],
                    "width": bounding_box["width"],
                    "height": bounding_box["height"]
                })

        except Exception as inner_error:
            print(f"[⚠️] Skipping element due to error: {inner_error}")
            continue

    return data


    # for element in elements:
    #     try:
    #         if await element.is_visible():
    #             tag_name = await element.evaluate("el => el.tagName")
    #             text = await element.text_content()
    #             bounding_box = await element.bounding_box()
    #             place_holder=await element.get_by_placeholder()


    #             if not tag_name or not text or not bounding_box or not place_holder:
    #                 continue
                
    #             # text_or_placeholder = text if text else place_holder
    #             if text:
    #                 data.append({
    #                     "page_name": page_name,
    #                     "tag_name": tag_name,
    #                     "text": text.strip(),
    #                     "x": bounding_box["x"],
    #                     "y": bounding_box["y"],
    #                     "width": bounding_box["width"],
    #                     "height": bounding_box["height"]
    #                 })
    #             else:
    #                  data.append({
    #                 "page_name": page_name,
    #                 "tag_name": tag_name,
    #                 "placeholder": place_holder.strip(),
    #                 "x": bounding_box["x"],
    #                 "y": bounding_box["y"],
    #                 "width": bounding_box["width"],
    #                 "height": bounding_box["height"]
    #             })

    #     except Exception as inner_error:
    #         print(f"[⚠️] Skipping element due to error: {inner_error}")
    #         continue

    # return data

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

#             print(f"[CHECK] '{ocr['text']}' vs '{dom['text']}' | sim={sim:.2f} dist={dist:.1f}")

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


def match_and_update(ocr_data, dom_data, collection, text_thresh=0.5, bbox_thresh=300):
    global LAST_MATCHED_RESULTS
    matched_records = []

    print(f"[DEBUG] Matching {len(ocr_data)} OCRs with {len(dom_data)} DOMs")
    print(dom_data)
    for ocr in ocr_data:
        if not ocr.get("text") or not ocr.get("bbox"):
            print(f"[SKIP] OCR missing text or bbox: {ocr}")
            continue

        best_match = None
        best_score = 0.0
        

        for dom in dom_data:
            # dom_text = dom.get("text", "") or dom.get("placeholder", "")
            dom_text = dom.get("text", "")
            if not dom_text.strip():
                dom_text = dom.get("placeholder", "")
            if not dom_text:
                continue

            sim = text_similarity(ocr["text"].lower(), dom_text.lower())
            dist = bbox_distance(ocr["bbox"], {"x": dom["x"], "y": dom["y"]})

            print(f"[CHECK] '{ocr['text']}' vs '{dom_text}' | sim={sim:.2f} dist={dist:.1f}")

            if sim >= text_thresh and sim > best_score:
                best_match = dom
                best_score = sim
                
            # if sim >= text_thresh and dist <= bbox_thresh and sim > best_score:
            #     best_match = dom
            #     best_score = sim

        if best_match:
            updated = ocr.copy()
            updated.update({
                "tag_name": best_match.get("tag_name", ""),
                "x": best_match.get("x", ""),
                "y": best_match.get("y", ""),
                "width": best_match.get("width", ""),
                "height": best_match.get("height", ""),
                "placeholder": best_match.get("placeholder", ""),
                "dom_matched": True,
                "match_timestamp": datetime.utcnow().isoformat()
            })

            collection.upsert(
                ids=[updated["id"]],
                documents=[updated["text"]],
                metadatas=[updated],
            )
            matched_records.append(updated)

    LAST_MATCHED_RESULTS = matched_records
    print(f"[DEBUG] Final matched_records = {len(matched_records)}")
    return matched_records



# def match_and_update(ocr_data, dom_data, collection, text_thresh=0.5, bbox_thresh=300):
#     global LAST_MATCHED_RESULTS
#     matched_records = []

#     print(f"[DEBUG] Matching {len(ocr_data)} OCRs with {len(dom_data)} DOMs")

#     for ocr in ocr_data:
#         if not ocr.get("label_text") or not ocr.get("bbox"):
#             print(f"[SKIP] OCR missing label_text or bbox: {ocr}")
#             continue

#         ocr_text = ocr["label_text"].strip().lower()
#         best_match = None
#         best_score = 0.0

#         for dom in dom_data:
#             dom_candidates = [
#                 dom.get("text", ""),
#                 dom.get("placeholder", ""),
#                 dom.get("value", "")
#             ]

#             for candidate in dom_candidates:
#                 if not candidate or not candidate.strip():
#                     continue

#                 sim = text_similarity(ocr_text, candidate.strip().lower())
#                 dist = bbox_distance(ocr["bbox"], {"x": dom["x"], "y": dom["y"]})

#                 print(f"[CHECK] '{ocr_text}' vs '{candidate.strip()}' | sim={sim:.2f}, dist={dist:.1f}")

#                 if sim >= text_thresh and dist <= bbox_thresh and sim > best_score:
#                     best_match = dom
#                     best_score = sim

#         if best_match:
#             updated = ocr.copy()
#             updated.update({
#                 "tag_name": best_match.get("tag_name", ""),
#                 "x": best_match.get("x", ""),
#                 "y": best_match.get("y", ""),
#                 "width": best_match.get("width", ""),
#                 "height": best_match.get("height", ""),
#                 "placeholder": best_match.get("placeholder", ""),
#                 "value": best_match.get("value", ""),
#                 "text": best_match.get("text", ""),
#                 "dom_matched": True,
#                 "match_timestamp": datetime.utcnow().isoformat()
#             })

#             collection.upsert(
#                 ids=[updated["id"]],
#                 documents=[updated["label_text"]],
#                 metadatas=[updated],
#             )
#             matched_records.append(updated)

#     LAST_MATCHED_RESULTS = matched_records
#     print(f"[✅] Matched {len(matched_records)} elements.")
#     return matched_records
