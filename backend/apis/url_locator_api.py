from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import uuid
import chromadb
import re
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from logic.url_locator_extractor import process_url_and_update_chroma, sanitize_metadata

router = APIRouter()

embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection(
    name="ocr_images",
    embedding_function=embedding_function
)

class URLInput(BaseModel):
    url: str

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)  # remove punctuation
    text = re.sub(r'\s+', ' ', text)     # collapse whitespace
    return text

@router.post("/submit-url")
async def submit_url(input_data: URLInput):
    url = input_data.url.rstrip("/")

    urls_to_process = [
        url,
        f"{url}/inventory.html",
        f"{url}/cart.html",
        f"{url}/checkout-step-one.html"
    ]

    locator_entries = []
    for process_url in urls_to_process:
        locators = await process_url_and_update_chroma(process_url, chroma_collection, embedding_function)
        locator_entries.extend(locators)

    matched_pairs = []
    total_matches = 0

    unique_page_names = set(locator['page_name'] for locator in locator_entries)

    for page_name in unique_page_names:
        print(f"[DEBUG] Querying OCR entries for page: {page_name}")

        for locator in filter(lambda x: x['page_name'] == page_name, locator_entries):
            locator_label = locator.get('label_text', '')
            if not locator_label:
                print(f"[SKIP] Locator {locator['element_id']} missing label_text.")
                continue

            normalized_label = normalize_text(locator_label)
            dom_embedding = embedding_function([normalized_label])[0]

            # ✅ FIX: use $and operator to combine filters
            ocr_results = chroma_collection.query(
                query_embeddings=[dom_embedding.tolist()],
                where={"$and": [{"page_name": page_name}, {"type": "ocr"}]},
                include=["metadatas", "distances"],
                n_results=1
            )

            print(f"[DEBUG] Query result for locator '{locator_label}': {ocr_results}")

            if not ocr_results["metadatas"] or not ocr_results["distances"]:
                print(f"[NO OCR] No OCR entries found for {page_name}")
                continue

            ocr_meta = ocr_results["metadatas"][0][0]
            distance = ocr_results["distances"][0][0]
            similarity_score = 1 - distance  # cosine similarity equivalent

            print(f"[SIMILARITY] Locator '{locator_label}' vs OCR '{ocr_meta.get('text')}' → distance={distance:.4f}, similarity={similarity_score:.4f}")

            if similarity_score >= 0.8:
                print(f"[MATCH ✅] Matched! Locator '{locator_label}' with OCR '{ocr_meta.get('text')}'")

                update_metadata = sanitize_metadata({
                    **locator,
                    "matched_ocr_id": ocr_meta.get("ocr_id"),
                    "matched_ocr_text": ocr_meta.get("text"),
                    "match_timestamp": datetime.utcnow().isoformat(),
                    "matched_ocr_region_image_path": ocr_meta.get("region_image_path")
                })

                chroma_collection.update(
                    ids=[locator['element_id']],
                    metadatas=[update_metadata]
                )

                matched_pairs.append({
                    "ocr_id": ocr_meta.get("ocr_id") or ocr_meta.get("id"),
                    "ocr_text": ocr_meta.get("text"),
                    "ocr_page": page_name,
                    "ocr_region_image_path": ocr_meta.get("region_image_path"),
                    "locator_id": locator['element_id'],
                    "locator_label": locator_label,
                    "locator_page": page_name,
                    "similarity_score": round(similarity_score, 4)
                })
                total_matches += 1
            else:
                print(f"[NO MATCH] Similarity below threshold: {similarity_score:.4f}")

    # Count total OCR entries for summary
    total_ocr_entries = 0
    for p in unique_page_names:
        get_result = chroma_collection.get(where={"page_name": {"$eq": p}}, include=["metadatas"])
        metadatas = get_result.get("metadatas", [])
        count = sum(len(m) if isinstance(m, list) else 1 for m in metadatas)
        total_ocr_entries += count

    return {
        "status": "success",
        "main_url": url,
        "pages_processed": list(unique_page_names),
        "total_locators": len(locator_entries),
        "total_ocr_entries": total_ocr_entries,
        "total_matches": total_matches,
        "matches": matched_pairs
    }
