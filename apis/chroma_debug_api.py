from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from services.chroma_service import collection

router = APIRouter()

@router.get("/chroma/data")
async def get_chroma_data(
    record_type: str = Query(None, description="Filter by record type: 'ocr', 'locator', 'ocr+locator'"),
    locator_null: bool = Query(False, description="If true, show entries where locator is null"),
    page_name: str = Query(None, description="Optional filter by page name")
):
    try:
        data = collection.get(include=["documents", "metadatas", "embeddings"])
        results = []

        for idx, meta in enumerate(data["metadatas"]):
            doc = data["documents"][idx]
            item = {"text": doc}
            item.update(meta)  # Merge all metadata fields dynamically

            # ✅ Filter by record_type (from metadata["type"])
            if record_type and item.get("type") != record_type:
                continue

            # ✅ Filter by locator null/non-null
            if locator_null and item.get("locator") not in [None, ""]:
                continue

            # ✅ Filter by page name
            if page_name and item.get("page_name") != page_name:
                continue

            results.append(item)

        return JSONResponse(content={"count": len(results), "data": results})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
