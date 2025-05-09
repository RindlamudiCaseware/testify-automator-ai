import traceback
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.image_text_api import router as image_router
from apis.url_locator_api import router as url_router
from apis.chroma_debug_api import router as chroma_debug_router
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

# ✅ Enable CORS for frontend at http://localhost:8080
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # 👈 allow ONLY frontend on port 8080
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

# Register API routes
app.include_router(image_router)
app.include_router(url_router)
app.include_router(chroma_debug_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
