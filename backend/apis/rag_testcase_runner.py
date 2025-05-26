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
from utils.match_utils import normalize_page_name, generalize_label
from services.test_generation_utils import client, get_class_name, filter_all_pages, collection
from pydantic import BaseModel

router = APIRouter()

class TestcaseRequest(BaseModel):
    source_url: str

project_root = Path(__file__).resolve().parents[1]
generated_runs_dir = project_root / "generated_runs"
zip_output_dir = project_root / "generated_zips"
generated_runs_dir.mkdir(parents=True, exist_ok=True)
zip_output_dir.mkdir(parents=True, exist_ok=True)

def filter_dom_matched_elements(page_name: str):
    return [r for r in collection.get(where={"page_name": page_name}).get("metadatas", []) if r.get("dom_matched")]

def sanitize_identifier(label: str) -> str:
    return re.sub(r'\W|^(?=\d)', '_', label.lower()) if label else "element"

def generate_page_object_class(page_name: str, locators: list[dict]) -> tuple[str, dict]:
    class_name = get_class_name(page_name)
    base_url = os.getenv("BASE_URL", "https://www.saucedemo.com/")
    lines = [
        "from playwright.sync_api import Page, expect",
        f"class {class_name}:",
        "    def __init__(self, page: Page):",
        "        self.page = page",
        "",
        "    def navigate_to_site(self):",
        f"        print(\"Navigating to site...\")",
        f"        self.page.goto('{base_url}')",
        ""
    ]
    method_names = {}

    for loc in locators:
        raw_label = (
            loc.get("label_text")
            or loc.get("text")
            or loc.get("placeholder")
            or loc.get("aria_label")
            or loc.get("name")
            or loc.get("id")
        )
        if not raw_label:
            continue

        label = generalize_label(raw_label)
        tag = loc.get("tag_name", "").lower()
        selector = loc.get("css") or f"text={label}"
        safe = sanitize_identifier(label)

        lines += [
            f"    def click_{safe}(self):",
            f"        print(\"Clicking {label}\")",
            f"        self.page.locator(\"{selector}\").click()",
            ""
        ]
        method_names.setdefault(label, []).append(f"click_{safe}()")

        if tag in ["input", "textarea", "select"]:
            lines += [
                f"    def fill_{safe}(self, value):",
                f"        print(\"Filling {label} with value\")",
                f"        self.page.locator(\"{selector}\").fill(value)",
                ""
            ]
            method_names[label].append(f"fill_{safe}(value)")

        lines += [
            f"    def expect_{safe}_visible(self):",
            f"        print(\"Expecting {label} to be visible\")",
            f"        expect(self.page.locator(\"{selector}\")).to_be_visible()",
            ""
        ]
        method_names[label].append(f"expect_{safe}_visible()")

    return "\n".join(lines), method_names

def generate_test_code_from_gpt(page_names: list[str], method_info: dict, source_url: str) -> str:
    prompt = f"""
You are a senior QA automation engineer.
Generate a complete Python Playwright test function called `test_end_to_end()`.

Instructions:
- Only write one test function `test_end_to_end()`
- Assume the following classes are already defined and imported:
{', '.join(get_class_name(page) for page in page_names)}
- Use:
with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
- Instantiate page objects like: `page_obj = ClassName(page)`
- Use only the available methods:
"""
    for page in page_names:
        prompt += f"\n# {get_class_name(page)}:\n"
        for method in method_info.get(page, []):
            prompt += f"- {method}\n"

    prompt += f"""
- Print "[PASS]" if successful, "[CRASH]" if any exception occurs
- End the test with `browser.close()`
- Do NOT include import statements, markdown, or comments
- Do NOT define any page classes; assume they are already imported

Target URL: {source_url}
Return ONLY executable Python code for test_end_to_end() with `if __name__ == "__main__"` block.
"""

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return result.choices[0].message.content.strip()

@router.post("/rag/generate-and-run")
def auto_generate_and_run(req: TestcaseRequest):
    source_url = req.source_url
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_folder = generated_runs_dir / f"run_{timestamp}"
    pages_dir = run_folder / "pages"
    tests_dir = run_folder / "tests"
    logs_dir = run_folder / "logs"
    meta_dir = run_folder / "metadata"
    locator_dir = run_folder / "locators"

    for d in [pages_dir, tests_dir, logs_dir, meta_dir, locator_dir]:
        d.mkdir(parents=True, exist_ok=True)
    (pages_dir / "__init__.py").touch()
    (run_folder / "__init__.py").touch()

    method_map = {}
    page_names = []

    for page in filter_all_pages():
        dom_data = filter_dom_matched_elements(page)
        if not dom_data:
            continue
        page_names.append(page)
        class_code, methods = generate_page_object_class(page, dom_data)
        (pages_dir / f"{page}_page.py").write_text(class_code, encoding="utf-8")
        method_list = []
        for method_group in methods.values():
            method_list.extend(method_group)
        method_map[page] = method_list

    test_code = generate_test_code_from_gpt(page_names, method_map, source_url)

    if test_code.startswith("```"):
        test_code = "\n".join(line for line in test_code.splitlines() if not line.startswith("```"))

    lines = test_code.splitlines()
    body_start = next(i for i, line in enumerate(lines) if line.strip().startswith("def test_end_to_end():"))
    test_body = ["    " + l for l in lines[body_start + 1:] if not l.strip().startswith("if __name__")]

    wrapped_test = [
        "def test_end_to_end():",
        "    browser = None",
        "    try:",
        *test_body,
        "    except Exception as e:",
        "        print(\"[CRASH]\", str(e))",
        "    finally:",
        "        if browser:",
        "            try:",
        "                browser.close()",
        "            except:",
        "                pass",
        "",
        "if __name__ == \"__main__\":",
        "    test_end_to_end()"
    ]

    import_lines = ["from playwright.sync_api import sync_playwright"]
    for page in page_names:
        import_lines.append(f"from pages.{page}_page import {get_class_name(page)}")

    full_test_code = "\n".join(import_lines + [""] + wrapped_test)
    test_path = tests_dir / "test_end_to_end.py"
    test_path.write_text(full_test_code, encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(test_path)],
        cwd=run_folder,
        env={**os.environ, "PYTHONPATH": str(run_folder)},
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    output = result.stdout + result.stderr
    status = "FAIL" if "[CRASH]" in output or "[FAIL]" in output or result.returncode != 0 else "PASS"
    (logs_dir / "test_output_end_to_end.log").write_text(output, encoding="utf-8")
    json.dump({"status": status, "timestamp": timestamp}, open(meta_dir / "metadata_end_to_end.json", "w"))

    all_data = collection.get(include=["metadatas"]).get("metadatas", [])
    with open(locator_dir / "all_locators.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2)

    zip_path = zip_output_dir / f"run_{timestamp}.zip"
    shutil.make_archive(str(zip_path).replace(".zip", ""), "zip", run_folder)

    return {
        "end_to_end": {
            "status": status,
            "test_output": output,
            "run_folder": str(run_folder),
            "zip_path": str(zip_path)
        }
    }

@router.get("/rag/download-zip")
def download_zip(path: str = Query(...)):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="ZIP not found")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/zip")
