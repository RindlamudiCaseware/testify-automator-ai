from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from chromadb import PersistentClient
from logic.manual_capture_mode import extract_dom_metadata, match_and_update, get_last_match_result, set_last_match_result
from playwright.async_api import async_playwright, Page, Browser
from utils.match_utils import normalize_page_name
from utils.file_utils import build_standard_metadata

router = APIRouter()
client = PersistentClient(path="./data/chroma_db")
collection = client.get_or_create_collection(name="ocr_images")

BROWSER: Browser = None
PAGE: Page = None
PLAYWRIGHT = None
CURRENT_PAGE_NAME: str = "unknown_page"

class LaunchRequest(BaseModel):
    url: str
    page_name: str

class CaptureRequest(BaseModel):
    page_name: str = None

class PageNameSetRequest(BaseModel):
    page_name: str

# ✅ Function to be exposed to browser JS
async def send_enrichment_requests(page_name: str):
    from httpx import AsyncClient
    async with AsyncClient() as client:
        await client.post("http://localhost:8001/set-current-page-name", json={"page_name": page_name})
        resp = await client.post("http://localhost:8001/capture-dom-from-client", json={"page_name": page_name})
        return resp.json()

@router.post("/launch-browser")
async def launch_browser(req: LaunchRequest):
    global PLAYWRIGHT, BROWSER, PAGE

    normalized_page_name = normalize_page_name(req.page_name)
    print(f"normalized_page_name: {normalized_page_name}")

    try:
        records = collection.get(where={"page_name": normalized_page_name}, include=["metadatas"])
        if not records.get("metadatas") or len(records["metadatas"]) == 0:
            raise HTTPException(status_code=400, detail=f"❌ No OCR data found for page_name '{normalized_page_name}'.")

        print(f"[DEBUG] ✅ Found {len(records['metadatas'])} OCR records for page_name: {normalized_page_name}")

        PLAYWRIGHT = await async_playwright().start()
        BROWSER = await PLAYWRIGHT.chromium.launch(headless=False, slow_mo=100)
        PAGE = await BROWSER.new_page()
        await PAGE.goto(req.url)

        # ✅ Expose function
        await PAGE.expose_function("sendEnrichmentRequests", send_enrichment_requests)

        # ✅ Inject modal + keyboard shortcut
        await PAGE.evaluate("""
        if (!window._ocrShortcutRegistered) {
            window._ocrShortcutRegistered = true;

            const modal = document.createElement('div');
            modal.innerHTML = `
                <div id="ocrModal" style="position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border:2px solid black;z-index:9999;display:none;">
                    <label>Enter Page Name:</label><br/>
                    <select id="pageDropdown" style="margin:5px;padding:5px;width:250px;"></select><br/>
                    <button onclick="triggerEnrichment()">Enrich</button>
                    <button onclick="document.getElementById('ocrModal').style.display='none'">Close</button>
                </div>
            `;
            document.body.appendChild(modal);

            async function loadAvailablePages() {
                try {
                    const res = await fetch('http://localhost:8001/available-pages');
                    const data = await res.json();
                    const dropdown = document.getElementById('pageDropdown');
                    dropdown.innerHTML = "";  // Clear previous
                    for (const page of data.pages) {
                        const option = document.createElement("option");
                        option.value = page;
                        option.innerText = page;
                        dropdown.appendChild(option);
                    }
                } catch (err) {
                    alert("❌ Failed to load available pages.");
                }
            }

            window.triggerEnrichment = async function() {
                const pageName = document.getElementById('pageDropdown').value;
                if (!pageName) return alert("❌ Page name is required.");
                try {
                    const result = await window.sendEnrichmentRequests(pageName);
                    console.log("✅ Matched:", result);
                    alert(`✅ Enriched ${result.count} elements`);
                } catch (err) {
                    alert("❌ Enrichment failed: " + err.message);
                }
            };

            document.addEventListener('keydown', function(e) {
                if (e.altKey && e.key === 'e') {
                    const modal = document.getElementById('ocrModal');
                    modal.style.display = 'block';
                    loadAvailablePages();
                }
            });
        }
        """)

        return {
            "message": f"✅ Browser launched and navigated to {req.url}. Press Alt+E to enrich any page.",
            "ocr_records_found": len(records["metadatas"]),
            "page_name": normalized_page_name
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/set-current-page-name")
async def set_page_name(req: PageNameSetRequest):
    global CURRENT_PAGE_NAME
    CURRENT_PAGE_NAME = req.page_name
    return {"message": f"✅ Page name set to: {CURRENT_PAGE_NAME}"}

@router.post("/capture-dom-from-client")
async def capture_from_keyboard(data: CaptureRequest):
    global PAGE, BROWSER
    try:
        page_name = data.page_name or 'unknown_page'
        if PAGE.is_closed():
            raise HTTPException(status_code=500, detail="❌ Cannot extract. Page is already closed.")

        dom_data = await extract_dom_metadata(PAGE, page_name)
        ocr_data = collection.get(where={"page_name": page_name})["metadatas"]

        updated_matches = match_and_update(ocr_data, dom_data, collection)

        standardized_matches = [
            build_standard_metadata(m, page_name, image_path="", source_url=PAGE.url)
            for m in updated_matches
        ]

        set_last_match_result(standardized_matches)

        return {
            "status": "success",
            "message": f"[Keyboard Trigger] Enriched {len(standardized_matches)} elements for page: {page_name}",
            "matched_data": standardized_matches,
            "count": len(standardized_matches)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-pages")
async def list_page_names():
    try:
        records = collection.get()
        page_names = list({meta.get("page_name", "unknown") for meta in records.get("metadatas", [])})
        return {"pages": page_names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.on_event("shutdown")
async def shutdown_browser():
    global PLAYWRIGHT
    if PLAYWRIGHT:
        await PLAYWRIGHT.stop()

@router.get("/latest-match-result")
async def get_latest_match_result():
    return {
        "status": "success",
        "matched_elements": get_last_match_result(),
        "count": len(get_last_match_result())
    }
