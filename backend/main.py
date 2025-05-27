import traceback
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.image_text_api import router as image_router
from apis.chroma_debug_api import router as debug_chroma_export_router
from apis.enrichment_api import router as enrichment_router
from apis.rag_testcase_runner import router as rag_router
from apis.generate_from_story import router as generate_from_story_router
import sys
import asyncio
import os
import subprocess

# ✅ Patch Playwright subprocess bug for Python 3.11 on Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"
    try:
        subprocess.run(["playwright", "install", "chromium"], check=True)
    except Exception as e:
        print("Playwright install failed:", e)

app = FastAPI(title="AI Test Extractor")

origins = [
    "http://localhost:3000",
    "https://www.saucedemo.com",
    "http://localhost:3001"  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("❌ Unhandled Exception:")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

app.include_router(image_router)
app.include_router(generate_from_story_router)
app.include_router(enrichment_router)
app.include_router(rag_router)
app.include_router(debug_chroma_export_router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
