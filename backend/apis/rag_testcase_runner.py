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
from playwright.sync_api import expect

load_dotenv()
router = APIRouter()

class TestcaseRequest(BaseModel):
    source_url: str

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
project_root = Path(__file__).resolve().parents[1]
chroma_client = PersistentClient(path=str(project_root / "data" / "chroma_db"))
collection = chroma_client.get_or_create_collection("element_metadata")

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

def generate_test_cases(enriched_data: list, source_url: str, page_name: str) -> str:
    grouped_by_label = {}
    for e in enriched_data:
        label = e.get("label_text")
        if label:
            grouped_by_label.setdefault(label, []).append(e)

    formatted = "\n".join([f"- {label}" for label in grouped_by_label])

    prompt = f"""
You are a senior QA automation expert.

Generate the following for the web page at {source_url}:

1. Manual test cases based on visible UI labels.
2. Automated test code in Python using Playwright.

Strict requirements for the generated code:
- Use the page object class named `{page_name.capitalize()}Page` from `page/{page_name}_page.py`
- Assume `page = browser.new_page()` is passed into the page class and methods are used instead of raw locators
- Do NOT directly use `page.locator(...)` inside the test — only call methods like `fill_username(...)`, `click_login_button()`, etc.
- Insert a comment (e.g., `# NOTE: multiple matches, refine if needed`) where uniqueness might be an issue.
- Include `print()` before each action or assertion.
- Use `expect(...).to_have_text(...)` or `.to_be_visible()` for validations.
- Add exception handling with `[PASS]`, `[FAIL]`, and `[CRASH]` messages.
- Include one test function, wrapped with `if __name__ == '__main__':`

Use the following labels as context for element actions:
{formatted}
"""

    print("[GPT] Generating test cases via GPT-4o...")
    res = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return res.choices[0].message.content.strip()

def generate_page_object_class(page_name: str, locators: list[dict]) -> str:
    class_name = f"{page_name.capitalize()}Page"
    indent = " " * 4
    method_lines = []

    for locator in locators:
        label = locator.get("label_text") or locator.get("text") or "element"
        sanitized = re.sub(r"\W|^(?=\d)", "_", label.lower())

        if "data_test" in locator and locator["data_test"]:
            selector = f'[data-test="{locator["data_test"]}"]'
        elif "css" in locator and locator["css"]:
            selector = locator["css"]
        elif "xpath" in locator and locator["xpath"]:
            selector = locator["xpath"]
        else:
            selector = f'text={label}'

        method_lines.append(f"    def click_{sanitized}(self):")
        method_lines.append(f"{indent}print(\"Clicking {label}\")")
        method_lines.append(f"{indent}self.page.locator(\"{selector}\").click()")
        method_lines.append("")

        method_lines.append(f"    def fill_{sanitized}(self, value):")
        method_lines.append(f"{indent}print(\"Filling {label} with value\")")
        method_lines.append(f"{indent}self.page.locator(\"{selector}\").fill(value)")
        method_lines.append("")

        method_lines.append(f"    def expect_{sanitized}_visible(self):")
        method_lines.append(f"{indent}print(\"Asserting {label} is visible\")")
        method_lines.append(f"{indent}expect(self.page.locator(\"{selector}\")).to_be_visible()")
        method_lines.append("")

    method_body = "\n".join(method_lines)

    return f"""
from playwright.sync_api import Page, expect

class {class_name}:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self):
        print("Navigating to https://www.saucedemo.com/")
        self.page.goto("https://www.saucedemo.com/")

{method_body}
""".strip()

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
        test_output = generate_test_cases(dom_elements, source_url, page_name)

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

        match = re.search(r"```python(.*?)```", test_output, re.DOTALL)
        py_code = match.group(1).strip() if match else "# code block not found"
        manual = test_output.replace(match.group(0), "").strip() if match else test_output

        # Inject import for page object
        import_line = f"from page.{page_name}_page import {page_name.capitalize()}Page"
        if import_line not in py_code:
            py_code = import_line + "\n\n" + py_code

        test_path.write_text(py_code, encoding="utf-8")
        manual_path.write_text(manual, encoding="utf-8")
        page_code = generate_page_object_class(page_name, dom_elements)
        page_object_path.write_text(page_code, encoding="utf-8")

        metadata_path.write_text(json.dumps({
            "url": source_url,
            "timestamp": timestamp,
            "status": "IN_PROGRESS"
        }, indent=2), encoding="utf-8")

        result = subprocess.run(
            [sys.executable, str(test_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        output = (result.stdout or "") + (result.stderr or "")
        log_path.write_text(output, encoding="utf-8")
        status = "FAIL" if result.returncode != 0 or "[FAIL]" in output or "[CRASH]" in output or "Locator.click: Error" in output else "PASS"

        metadata_path.write_text(json.dumps({
            "url": source_url,
            "timestamp": timestamp,
            "status": status
        }, indent=2), encoding="utf-8")

        zip_name = f"{Path(run_folder).name}_{page_name}.zip"
        zip_path = zip_output_dir / zip_name
        shutil.make_archive(str(zip_path).replace(".zip", ""), 'zip', page_folder)
        zip_paths.append(str(zip_path))

        final_status[page_name] = {
            "status": status,
            "manual_testcases": manual,
            "python_test_code": py_code,
            "test_output": output,
            "run_folder": str(page_folder),
            "zip_path": str(zip_path)
        }

    return final_status

@router.get("/rag/download-zip")
def download_zip(path: str = Query(..., description="Path to the .zip file")):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="ZIP file not found.")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/zip")