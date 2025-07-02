# apis/test_ui_vision_api.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import zipfile
import tempfile
import os
import base64
from PIL import Image
import openai
import logging

from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

# PROMPT = """ You are an expert computer vision model using OpenAI's capabilities.

# Your task is to analyze a given screenshot of a user interface (UI) and classify **every visible element** without summarization.

# Please follow these strict rules:

# 1. For every visible part of the image:
#    - Identify **all labels**, **buttons**, **descriptive paragraphs**, **headers**, **titles**, **dropdown values**, and **prices**.

# 2. For each identified element:
#    - Classify it into one of the following types: `textbox`, `button`, `checkbox`, `select`, or `label`.
#    - Output in this format: `<label text> - <element type>`

# 3. Preserve full text:
#    - Do NOT shorten, summarize, or omit any label or paragraph text.
#    - If a label has multiple lines (like product descriptions), output the entire text as one label.

# 4. Maintain visual order:
#    - Traverse from top-left to bottom-right in a vertical reading sequence.

# 5. Output formatting:
#    - Return the result as a plain newline-separated list.
#    - Do NOT explain anything.
#    - Do NOT include markdown, bullets, or JSON.
#    - Output only raw lines like: `Label Text - type`"""

PROMPT = """You are an expert computer vision model using OpenAI's capabilities.

Your task is to analyze a given screenshot of a user interface (UI) and extract every visible UI element, accurately identifying its type and intent.

1. Element Extraction:
   - Extract ALL visible UI text from the image, including:
     • Input fields
     • Buttons
     • Labels (including credentials, instructions)
     • Dropdowns, checkboxes

2. Element Classification:
   - For each element, output:
     • Label text (exact as visible)
     • Element type (one of: `textbox`, `button`, `label`, `checkbox`, `select`)
     • Intent (like: `login`, `username`, `password`, `price_label`, `submit`, `add_to_cart`, `password_info`, `username_info`, etc.)

   - For credentials or user types like `standard_user`, `secret_sauce`, assign type as `label` and use intent like `username_info`, `password_info`.

3. Format:
   - Each element on its own line:
     <label text> - <element type> - <intent>

4. Rules:
   - Do NOT rephrase or skip lines.
   - Preserve punctuation, line breaks.
   - Traverse from top-left to bottom-right.

5. Only output newline-separated lines like:
   Username - textbox - login
   Login - button - login
   secret_sauce - label - password_info
"""


@router.post("/test-ui-vision")
async def test_ui_vision(zipfile_upload: UploadFile = File(...)):
    if not zipfile_upload.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a .zip file")

    results = {}

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_zip:
            tmp_zip.write(await zipfile_upload.read())
            tmp_zip_path = tmp_zip.name
            # logger.debug(f"📦 Temp ZIP saved at: {tmp_zip_path}")

        with zipfile.ZipFile(tmp_zip_path, 'r') as zip_ref:
            with tempfile.TemporaryDirectory() as extract_dir:
                zip_ref.extractall(extract_dir)
                # logger.debug(f"📂 Extracted files to: {extract_dir}")

                image_files = [
                    os.path.join(extract_dir, f)
                    for f in zip_ref.namelist()
                    if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
                ]

                for image_path in image_files:
                    with open(image_path, "rb") as img_file:
                        image_base64 = base64.b64encode(img_file.read()).decode("utf-8")

                    # logger.debug(f"🧠 Sending image: {os.path.basename(image_path)} to OpenAI")

                    try:
                        client = openai.OpenAI()

                        response = client.chat.completions.create(
                            model="gpt-4o",
                            messages=[
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": PROMPT},
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": f"data:image/png;base64,{image_base64}"
                                            }
                                        }
                                    ]
                                }
                            ],
                            max_tokens=500
                        )

                        output = response.choices[0].message.content.strip()
                        results[os.path.basename(image_path)] = output
                        # logger.debug(f"✅ GPT-4o Output for {os.path.basename(image_path)}:\n{output}")

                    except Exception as gpt_error:
                        # logger.error(f"❌ Failed on {image_path}: {gpt_error}")
                        results[os.path.basename(image_path)] = f"ERROR: {str(gpt_error)}"

    except Exception as e:
        logger.error("❌ Error processing uploaded ZIP:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "results": results}

if __name__ == "__main__":
    from fastapi import FastAPI
    import uvicorn

    app = FastAPI()
    app.include_router(router)

    uvicorn.run(app, host="127.0.0.1", port=8005, reload=False)

