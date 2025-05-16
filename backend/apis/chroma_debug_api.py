from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from services.chroma_service import collection as chroma_collection

router = APIRouter()

@router.get("/chroma/data")
async def get_chroma_data(
    record_type: str = Query(None, description="Filter by record type: 'ocr', 'locator', 'ocr+locator'"),
    locator_null: bool = Query(False, description="If true, show entries where locator is null"),
    page_name: str = Query(None, description="Optional filter by page name")
):
    try:
        data = chroma_collection.get(include=["documents", "metadatas", "embeddings"])
        results = []

        for idx, meta in enumerate(data["metadatas"]):
            doc = data["documents"][idx]
            item = {"text": doc}
            item.update(meta)

            if record_type and item.get("type") != record_type:
                continue

            if locator_null and item.get("locator") not in [None, ""]:
                continue

            if page_name and item.get("page_name") != page_name:
                continue

            results.append(item)

        return JSONResponse(content={"count": len(results), "data": results})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
