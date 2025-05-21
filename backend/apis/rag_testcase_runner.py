# backend/apis/rag_testcase_runner.py

import os
import sys
import subprocess
import re
import json
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from utils.match_utils import normalize_page_name
from chromadb import PersistentClient
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
router = APIRouter()

class TestcaseRequest(BaseModel):
    source_url: str

# === Initialize OpenAI ===
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# === ChromaDB connection ===
project_root = Path(__file__).resolve().parents[1]
chroma_client = PersistentClient(path=str(project_root / "data" / "chroma_db"))
collection = chroma_client.get_or_create_collection("element_metadata")

# === Output directories ===
generated_runs_dir = project_root / "generated_runs"
generated_runs_dir.mkdir(parents=True, exist_ok=True)

zip_output_dir = project_root / "generated_zips"
zip_output_dir.mkdir(parents=True, exist_ok=True)

def filter_all_pages():
    records = collection.get()
    page_names = set(meta.get("page_name", "unknown") for meta in records.get("metadatas", []))
    return list(page_names)

def filter_dom_matched_elements(page_name: str):
    page_name = normalize_page_name(page_name)
    results = collection.get(where={"page_name": page_name})
    return [r for r in results.get("metadatas", []) if r.get("dom_matched") is True]

def generate_test_cases(enriched_data: list, source_url: str) -> str:
    grouped_by_label = {}
    for e in enriched_data:
        label = e.get("label_text")
        if label:
            grouped_by_label.setdefault(label, []).append(e)
    formatted = "\n".join([f"{label}" for label in grouped_by_label])

    prompt = f"""You are a senior QA automation expert using Playwright in Python.

Write:
1. Manual test cases
2. Playwright Python code for automated testing

Requirements for the code:
- Only use image-visible selectors like:
  - page.get_by_placeholder("...")
  - page.get_by_text("...")
  - page.get_by_role("button", name="...")
- Avoid all use of page.locator(...) or XPath/CSS.
- Use print() before each action or assertion.
- Use expect(...).to_have_text("...", ignore_case=True) to verify visible messages.
- Use this URL in page.goto: {source_url}

Add this at the bottom of the code:

if __name__ == "__main__":
    try:
        test_login_add_to_cart_checkout()
        print("[PASS] Test passed successfully.")
    except AssertionError as assertion_err:
        print("[FAIL] Assertion failed:", assertion_err)
    except Exception as exception_err:
        print("[CRASH] Test crashed:", exception_err)

Use the following visible UI text elements as reference:
{formatted}
"""
    print("[GPT] Generating test cases via GPT-4o...")
    res = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return res.choices[0].message.content.strip()

def run_testcase(page_name: str, code: str, source_url: str, run_folder: Path, status_placeholder: str = "IN_PROGRESS"):
    page_folder = run_folder / page_name
    tests_dir = page_folder / "tests"
    page_code_dir = page_folder / "page"
    logs_dir = page_folder / "logs"
    manual_dir = page_folder / "manual"
    meta_dir = page_folder / "metadata"

    for sub in [tests_dir, page_code_dir, logs_dir, manual_dir, meta_dir]:
        sub.mkdir(parents=True, exist_ok=True)

    test_path = tests_dir / f"test_{page_name}.py"
    log_path = logs_dir / f"test_output_{page_name}.log"
    manual_path = manual_dir / f"manual_testcases_{page_name}.txt"
    metadata_path = meta_dir / f"metadata_{page_name}.json"
    page_object_path = page_code_dir / f"{page_name}_page.py"

    match = re.search(r"```python(.*?)```", code, re.DOTALL)
    py_code = match.group(1).strip() if match else "# code block not found"
    manual = code.replace(match.group(0), "").strip() if match else code

    test_path.write_text(py_code, encoding="utf-8")
    manual_path.write_text(manual, encoding="utf-8")

    # Auto-generate page object template
    page_class_code = f'''from playwright.sync_api import Page, expect

class {page_name.capitalize()}Page:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self):
        self.page.goto("{source_url}")

    def assert_common_elements(self):
        pass
'''.strip()
    page_object_path.write_text(page_class_code, encoding="utf-8")

    metadata_path.write_text(json.dumps({
        "url": source_url,
        "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "status": status_placeholder
    }, indent=2), encoding="utf-8")

    print("[Run] Executing test case at:", test_path)
    result = subprocess.run([sys.executable, str(test_path)], capture_output=True, text=True)
    output = result.stdout + result.stderr
    log_path.write_text(output, encoding="utf-8")

    status = "FAIL" if result.returncode != 0 or "[FAIL]" in output or "[CRASH]" in output or "Locator.click: Error" in output else "PASS"

    json.dump({
        "url": source_url,
        "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "status": status
    }, metadata_path.open("w", encoding="utf-8"), indent=2)

    return py_code, manual, output, status, str(run_folder)

@router.post("/rag/generate-and-run")
def auto_generate_and_run(req: TestcaseRequest):
    source_url = req.source_url
    run_page_names = filter_all_pages()
    final_status = {}
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_folder = generated_runs_dir / f"run_{timestamp}"
    run_folder.mkdir(parents=True, exist_ok=True)
    zip_paths = []

    for page_name in run_page_names:
        dom_elements = filter_dom_matched_elements(page_name)
        if not dom_elements:
            continue
        test_output = generate_test_cases(dom_elements, source_url)
        code, manual, output, status, _ = run_testcase(page_name, test_output, source_url, run_folder)

        zip_name = f"{Path(run_folder).name}_{page_name}.zip"
        zip_path = zip_output_dir / zip_name
        shutil.make_archive(str(zip_path).replace(".zip", ""), 'zip', run_folder / page_name)
        zip_paths.append(str(zip_path))

        final_status[page_name] = {
            "status": status,
            "manual_testcases": manual,
            "python_test_code": code,
            "test_output": output,
            "run_folder": str(run_folder / page_name),
            "zip_path": str(zip_path)
        }

    return final_status

@router.get("/rag/download-zip")
def download_zip(path: str = Query(..., description="Path to the .zip file")):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="ZIP file not found.")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/zip")
