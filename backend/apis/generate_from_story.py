from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime
from pathlib import Path
import os, re, json
from services.test_generation_utils import (
    client, get_class_name, filter_all_pages, collection
)
from utils.match_utils import generalize_label

router = APIRouter()

class UserStoryRequest(BaseModel):
    user_story: str = Field(..., example="Login and add backpack to cart")

def sanitize_identifier(label: str) -> str:
    return re.sub(r'\W|^(?=\d)', '_', label.lower()) if label else "element"

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    user_story = req.user_story
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_folder = Path(__file__).resolve().parents[1] / "generated_runs" / f"story_{timestamp}"

    pages_dir = run_folder / "pages"
    tests_dir = run_folder / "tests"
    logs_dir = run_folder / "logs"
    meta_dir = run_folder / "metadata"

    for d in [pages_dir, tests_dir, logs_dir, meta_dir]:
        d.mkdir(parents=True, exist_ok=True)
    for init in [run_folder, pages_dir, tests_dir]:
        (init / "__init__.py").touch()

    page_names = []
    method_map = {}

    for page in filter_all_pages():
        label_entries = [
            r for r in collection.get(where={"page_name": page}).get("metadatas", [])
            if r.get("label_text")
        ]

        if not label_entries:
            continue

        page_names.append(page)
        class_name = get_class_name(page)
        method_lines = [
            "from playwright.sync_api import Page, expect",
            f"class {class_name}:",
            "    def __init__(self, page: Page):",
            "        self.page = page",
            "",
            "    def navigate_to_site(self):",
            "        print(\"Navigating to site...\")",
            "        self.page.goto('https://www.saucedemo.com/')",
            ""
        ]

        method_list = []

        for entry in label_entries:
            label = generalize_label(entry["label_text"])
            safe = sanitize_identifier(label)

            method_lines += [
                f"    def fill_{safe}(self, value):",
                f"        print(\"Filling {label} with value\")",
                f"        self.page.get_by_label(\"{label}\").fill(value)",
                ""
            ]
            method_list.append(f"fill_{safe}(value)")

            method_lines += [
                f"    def click_{safe}(self):",
                f"        print(\"Clicking {label}\")",
                f"        self.page.get_by_label(\"{label}\").click()",
                ""
            ]
            method_list.append(f"click_{safe}()")

        (pages_dir / f"{page}_page.py").write_text("\n".join(method_lines), encoding="utf-8")
        method_map[page] = method_list

    if not method_map:
        return {"manual_testcase": "", "auto_testcase": "# No label_text found in ChromaDB"}

    escaped_story = user_story.replace('"""', '"\"\"')
    story_block = f'"""{escaped_story}"""'

    prompt = f"""
You are a senior QA automation engineer.
Generate a Python Playwright test function called `test_end_to_end()` using only the below page methods.
Do NOT use `locator`, `XPath`, `CSS`, or anything except the provided methods.

User Story:
{story_block}

Page Object Methods:
"""
    for page in page_names:
        prompt += f"\n# {get_class_name(page)}:\n"
        for method in method_map[page]:
            prompt += f"- {method}\n"

    prompt += """
Instructions:
- Define the entire test inside `test_end_to_end()`.
- Use `with sync_playwright()` to launch the browser.
- Pass the `page` object to each Page Object class when instantiating.
- Do NOT redefine or shadow class names.
- Include `if __name__ == \"__main__\"` block.
- Do not include imports or class definitions.
- Print \"[PASS]\" on success, \"[CRASH]\" on failure.
"""

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )

    test_code = result.choices[0].message.content.strip()

    # Remove ``` markdown fences if any
    test_code = "\n".join(line for line in test_code.splitlines() if not line.strip().startswith("```"))

    # Sanitize: remove explanation lines after code
    valid_lines = []
    for line in test_code.splitlines():
        stripped = line.strip()
        if stripped == "":
            valid_lines.append(line)
        elif re.match(r"^(def |class |from |import |with |try:|except|print|page\.|self\.|browser|context|if __name__)", stripped):
            valid_lines.append(line)
        elif stripped.startswith("#"):
            valid_lines.append(line)
        else:
            break  # stop at first non-code line
    test_code = "\n".join(valid_lines)

    import_lines = ["from playwright.sync_api import sync_playwright"]
    for page in page_names:
        import_lines.append(f"from pages.{page}_page import {get_class_name(page)}")

    full_test_code = "\n".join(import_lines + [""] + [test_code])
    test_path = tests_dir / "test_from_story.py"
    test_path.write_text(full_test_code, encoding="utf-8")

    (logs_dir / "test_output.log").write_text("[SKIPPED] Execution skipped", encoding="utf-8")
    with open(meta_dir / "metadata.json", "w") as f:
        json.dump({"timestamp": timestamp, "executed": False}, f)

    return {
        "manual_testcase": f"### Manual Test Case\n\n**Objective**: {user_story}\n\n1. Navigate to saucedemo.com\n2. {user_story}\n\n**Expected**: The user completes the flow successfully.",
        "auto_testcase": test_code
    }
