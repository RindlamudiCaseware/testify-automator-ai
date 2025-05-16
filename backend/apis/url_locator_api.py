from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from logic.url_locator_extractor import process_url_and_update_chroma
from utils.match_utils import normalize_page_name
from utils.file_utils import sanitize_metadata, build_standard_metadata  # ✅ make sure to import this

router = APIRouter()

embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection(
    name="ocr_images",
    embedding_function=embedding_function
)

class URLInput(BaseModel):
    url: str

@router.post("/submit-url")
async def submit_url(input_data: URLInput):
    url = input_data.url.rstrip("/")
    url_suffixes = ["", "/inventory.html", "/cart.html", "/checkout-step-one.html", "/checkout-step-two.html", "/checkout-complete.html"]
    urls_to_process = [f"{url}{suffix}" for suffix in url_suffixes]

    results = []
    locator_results = []
    for full_url in urls_to_process:
        page_name = normalize_page_name(full_url)
        locators = await process_url_and_update_chroma(
            full_url, chroma_collection, embedding_function, page_name=page_name
        )
        for locator in locators:
            metadata = build_standard_metadata(locator, page_name, source_url=input_data.url)  # ✅ unified builder
            chroma_collection.add(
                ids=[metadata["id"]],
                documents=[metadata["text"]],
                metadatas=[metadata]
            )
            results.append(metadata)
            locator_results.append(locator)

    return {
        "status": "success",
        "main_url": url,
        "pages_processed": list(set(locator["page_name"] for locator in locator_results)),
        "total_locators": len(locator_results),
        "total_matches": 0,
        "matches": [],
        "data": results
    }
