import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from config.settings import CHROMA_PATH
from fastapi.concurrency import run_in_threadpool
import logging
import json

# Setup ChromaDB client and collection
embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(name="login_page", embedding_function=embedding_function)

# Logger
error_logger = logging.getLogger("chroma_upsert_errors")
error_logger.setLevel(logging.WARNING)
handler = logging.FileHandler("chroma_upsert_errors.log")
handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
error_logger.addHandler(handler)

def _sanitize_metadata_value(value):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return value

def upsert_text_record(record: dict):
    bbox_values = record.get('bbox') or [0,0,0,0]
    bbox_str = ",".join(map(str, bbox_values))

    metadata = {
        "element_id": _sanitize_metadata_value(record.get("id")),
        "page_name": _sanitize_metadata_value(record.get("page")),
        "intent": _sanitize_metadata_value(record.get("text")),
        "tag": "",
        "label_text": _sanitize_metadata_value(record.get("text")),
        "css_selector": "",
        "get_by_text": _sanitize_metadata_value(record.get("text")),
        "get_by_role": "",
        "xpath": "",
        "x": bbox_values[0],
        "y": bbox_values[1],
        "width": bbox_values[2],
        "height": bbox_values[3],
        "bbox": bbox_str,  # ✅ store bbox as string
        "position_relation": "",
        "html_snippet": "",
        "confidence_score": 0.0,
        "visibility_score": 0.0,
        "locator_stability_score": 0.0,
        "snapshot_id": "",
        "timestamp": "",
        "source_url": "",
        "used_in_tests": "",
        "last_tested": "",
        "healing_success_rate": 0.0,
        "region_image_path": _sanitize_metadata_value(record.get("region_image_path")),
        "locator": _sanitize_metadata_value(record.get("locator")),
        "type": "ocr"
    }

    embedding_value = embedding_function([record["text"]])[0]

    try:
        collection.upsert(
            documents=[record["text"]],
            metadatas=[metadata],
            embeddings=[embedding_value],
            ids=[record["id"]]
        )
    except Exception as e:
        error_logger.warning(f"upsert_text_record failed: {str(e)} | Record: {record}")

def upsert_element_record(record: dict):
    document_content = record.get("html_snippet") or record.get("label_text") or record.get("intent")

    metadata = {
        "element_id": _sanitize_metadata_value(record.get("element_id")),
        "page_name": _sanitize_metadata_value(record.get("page_name")),
        "intent": _sanitize_metadata_value(record.get("intent")),
        "tag": _sanitize_metadata_value(record.get("tag")),
        "label_text": _sanitize_metadata_value(record.get("label_text")),
        "css_selector": _sanitize_metadata_value(record.get("css_selector")),
        "get_by_text": _sanitize_metadata_value(record.get("get_by_text")),
        "get_by_role": _sanitize_metadata_value(record.get("get_by_role")),
        "xpath": _sanitize_metadata_value(record.get("xpath")),
        "x": record.get("x") if record.get("x") is not None else 0,
        "y": record.get("y") if record.get("y") is not None else 0,
        "width": record.get("width") if record.get("width") is not None else 0,
        "height": record.get("height") if record.get("height") is not None else 0,
        "position_relation": _sanitize_metadata_value(record.get("position_relation")),
        "html_snippet": _sanitize_metadata_value(record.get("html_snippet")),
        "confidence_score": record.get("confidence_score") if record.get("confidence_score") is not None else 0.0,
        "visibility_score": record.get("visibility_score") if record.get("visibility_score") is not None else 0.0,
        "locator_stability_score": record.get("locator_stability_score") if record.get("locator_stability_score") is not None else 0.0,
        "snapshot_id": _sanitize_metadata_value(record.get("snapshot_id")),
        "timestamp": _sanitize_metadata_value(record.get("timestamp")),
        "source_url": _sanitize_metadata_value(record.get("source_url")),
        "used_in_tests": _sanitize_metadata_value(record.get("used_in_tests")),
        "last_tested": _sanitize_metadata_value(record.get("last_tested")),
        "healing_success_rate": record.get("healing_success_rate") if record.get("healing_success_rate") is not None else 0.0,
        "type": "locator"
    }

    try:
        embedding_value = record.get("combined_embedding") or record.get("text_embedding")
        if not embedding_value:
            embedding_value = embedding_function([document_content])[0]

        collection.upsert(
            documents=[document_content],
            metadatas=[metadata],
            embeddings=[embedding_value],
            ids=[record["element_id"]]
        )
    except Exception as e:
        error_logger.warning(f"upsert_element_record failed: {str(e)} | Record: {record}")

def fetch_ocr_entries():
    results = collection.get(where={"type": "ocr"})

    ocr_entries = []
    for id_, doc, meta in zip(results["ids"], results["documents"], results["metadatas"]):
        ocr_entries.append({
            "id": id_,
            "text": doc,
            "page": meta.get("page_name", "")
        })

    print(f"[FETCH OCR] Found {len(ocr_entries)} OCR entries")
    for entry in ocr_entries:
        print(f"  ID: {entry['id']} | Text: {entry['text']} | Page: {entry['page']}")
    return ocr_entries

def _update_locator_by_text_sync(entry_id: str, locator: str):
    item = collection.get(ids=[entry_id])
    doc = item["documents"][0]
    meta = item["metadatas"][0]
    meta["locator"] = locator
    meta["source_type"] = "url"
    meta_sanitized = {k: _sanitize_metadata_value(v) for k, v in meta.items()}

    collection.upsert(
        documents=[doc],
        metadatas=[meta_sanitized],
        ids=[entry_id]
    )

async def update_locator_by_text(entry_id: str, locator: str):
    await run_in_threadpool(_update_locator_by_text_sync, entry_id, locator)
