from fastapi import APIRouter
from pydantic import BaseModel
from difflib import SequenceMatcher
from datetime import datetime
import uuid
import chromadb
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

def is_similar(a, b, threshold=0.8):
    return SequenceMatcher(None, a, b).ratio() >= threshold

@router.post("/submit-url")
async def submit_url(input_data: URLInput):
    url = input_data.url

    urls_to_process = [
        url,
        f"{url}inventory.html",
        f"{url}cart.html",
        f"{url}checkout-step-one.html"
    ]

    locator_entries = []
    for url in urls_to_process:
        locators = await process_url_and_update_chroma(url, chroma_collection, embedding_function)
        locator_entries.extend(locators)

    matched_pairs = []
    total_matches = 0

    unique_page_names = set(locator['page_name'] for locator in locator_entries)

    for page_name in unique_page_names:
        ocr_results_page = chroma_collection.query(
            query_texts=["dummy"],  # dummy required by Chroma
            where={"page_name": page_name},
            include=["metadatas"]
        )

        print(f"[DEBUG] Raw OCR results for {page_name}: {ocr_results_page.get('metadatas', [])}")

        # flatten results to list of dicts
        ocr_entries = [
            meta
            for metadata_list in ocr_results_page.get("metadatas", [])
            for meta in (metadata_list if isinstance(metadata_list, list) else [metadata_list])
            if meta.get("type") == "ocr"
        ]

        print(f"[DEBUG] Flattened {len(ocr_entries)} OCR entries for {page_name}")

        for ocr in ocr_entries:
            ocr_text_clean = (ocr.get('text') or '').strip().lower()
            ocr_id = ocr.get('ocr_id') or ocr.get('id') or str(uuid.uuid4())
            print(f"[OCR] Checking OCR id={ocr_id}, text='{ocr_text_clean}', region_image={ocr.get('region_image_path')}")

            for locator in filter(lambda x: x['page_name'] == page_name, locator_entries):
                locator_label_clean = (locator.get('label_text') or '').strip().lower()
                print(f"   [LOCATOR] Comparing to locator label='{locator_label_clean}'")

                is_match = (
                    ocr_text_clean == locator_label_clean or
                    ocr_text_clean in locator_label_clean or
                    locator_label_clean in ocr_text_clean or
                    is_similar(ocr_text_clean, locator_label_clean)
                )

                print(f"      [RESULT] Match? {is_match}")

                if is_match:
                    print(f"[MATCH ✅] OCR '{ocr_text_clean}' matched locator '{locator_label_clean}' on {page_name}")

                    update_metadata = {
                        **locator,
                        "matched_ocr_id": ocr_id,
                        "matched_ocr_text": ocr['text'],
                        "match_timestamp": datetime.utcnow().isoformat(),
                        "matched_ocr_region_image_path": ocr.get("region_image_path")  # ✅ include region image
                    }
                    update_metadata = sanitize_metadata(update_metadata)

                    chroma_collection.update(
                        ids=[locator['element_id']],
                        metadatas=[update_metadata]
                    )
                    print(f"[UPDATE] Locator {locator['element_id']} updated in ChromaDB with OCR region image {ocr.get('region_image_path')}")

                    matched_pairs.append({
                        "ocr_id": ocr_id,
                        "ocr_text": ocr['text'],
                        "ocr_page": page_name,
                        "ocr_region_image_path": ocr.get("region_image_path"),  # ✅ return in output
                        "locator_id": locator['element_id'],
                        "locator_label": locator['label_text'],
                        "locator_page": page_name
                    })
                    total_matches += 1
                    break

    total_ocr_entries = 0
    for p in unique_page_names:
        get_result = chroma_collection.get(where={"page_name": {"$eq": p}}, include=["metadatas"])
        metadatas = get_result.get("metadatas", [])
        count = len([meta for meta_list in metadatas for meta in (meta_list if isinstance(meta_list, list) else [meta_list])])
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
