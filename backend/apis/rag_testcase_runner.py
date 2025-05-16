# backend/apis/rag_testcase_runner.py

import os
import sys
import subprocess
import re
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
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

# ✅ Store generated tests in root-level data folder
testcase_dir = project_root / "data" / "generated_tests"
testcase_dir.mkdir(parents=True, exist_ok=True)

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

def run_testcase(code: str, folder: Path):
    folder.mkdir(parents=True, exist_ok=True)
    test_path = folder / "test_generated.py"
    log_path = folder / "test_output.log"
    manual_path = folder / "manual_testcases.txt"

    match = re.search(r"```python(.*?)```", code, re.DOTALL)
    py_code = match.group(1).strip() if match else "# code block not found"
    manual = code.replace(match.group(0), "").strip() if match else code

    test_path.write_text(py_code, encoding="utf-8")
    manual_path.write_text(manual, encoding="utf-8")

    print("[Run] Executing test case at:", test_path)
    result = subprocess.run([sys.executable, str(test_path)], capture_output=True, text=True)
    log_path.write_text(result.stdout + result.stderr, encoding="utf-8")

    return py_code, manual, result.stdout + result.stderr, result.returncode

@router.post("/rag/generate-and-run")
def auto_generate_and_run(req: TestcaseRequest):
    source_url = req.source_url
    page_name = normalize_page_name(source_url)
    dom_elements = filter_dom_matched_elements(page_name)

    test_output = generate_test_cases(dom_elements, source_url)
    folder = testcase_dir / normalize_page_name(page_name)
    code, manual, output, status_code = run_testcase(test_output, folder)

    return {
        "page_name": page_name,
        "status": "PASS" if status_code == 0 else "FAIL",
        "manual_testcases": manual,
        "python_test_code": code,
        "test_output": output
    }
