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
    site_url: str = Field(default="")

def sanitize_identifier(label: str) -> str:
    label = label.strip().lower()
    label = re.sub(r'\s+', '_', label)
    label = re.sub(r'[^a-z0-9_]', '', label)
    label = re.sub(r'_+', '_', label)
    label = label.strip('_')
    return label if label else "element"

def infer_base_url_from_page_names(page_names: list[str]) -> str:
    """
    Extracts a common prefix from page names using regex and infers a base URL.
    For example, ['saucedemo_login', 'saucedemo_cart'] → 'https://www.saucedemo.com'
    """
    if not page_names:
        return "https://example.com"

    # Use regex to get common prefix up to first underscore
    matches = [re.match(r"([a-zA-Z0-9\-]+)_", name) for name in page_names]
    domains = [m.group(1) for m in matches if m]

    if not domains:
        return "https://example.com"

    # Take the most common domain prefix
    from collections import Counter
    most_common = Counter(domains).most_common(1)[0][0]

    return f"https://www.{most_common}.com"

def generate_test_code_from_methods(user_story: str, method_map: dict, page_names: list[str], site_url: str) -> str:
    escaped_story = user_story.replace('"""', '"\"\"')
    story_block = f'"""{escaped_story}"""'

    dynamic_steps = []
    for page, methods in method_map.items():
        for method in methods:
            if method.startswith("fill_"):
                arg_name = method.replace("fill_", "")
                dynamic_steps.append(f"    - Call `{method}(\"<{arg_name}>\")`")
            elif method.startswith("click_"):
                dynamic_steps.append(f"    - Call `{method}()`")

    prompt = f"""
You are a senior QA automation engineer.
Generate ONLY a complete end-to-end Playwright test script in Python using Page Object Model (POM).

User Story:
{story_block}

Instructions:
- 🚫 VERY IMPORTANT: DO NOT redefine or implement any page object class or method.
- Use ONLY the page object methods listed below.
- DO NOT use page.locator(), XPath, or CSS selectors.
- Use sync_playwright() to launch the browser.
- Instantiate page objects using ClassName(page).
- Navigate to the site using `page.goto('{site_url}')`
- Use the methods listed below to automate the flow:
{chr(10).join(dynamic_steps)}
- Print "[PASS]" on success or "[CRASH]" on failure
- Wrap the test in `if __name__ == '__main__'` block
- Output ONLY valid Python code. No Markdown. No class definitions. No explanations.

Page Object Methods:
"""
    for page in page_names:
        prompt += f"\n# {get_class_name(page)}:\n"
        for method in method_map[page]:
            prompt += f"- def {method}\n"

    print("Prompt length:", len(prompt))
    print("Prompt preview:\n", prompt[:2000])

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048
    )

    test_code = result.choices[0].message.content.strip()
    test_code = re.sub(r"```python|```", "", test_code).strip()
    return test_code

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    user_story = req.user_story
    site_url = req.site_url
    if not site_url or site_url == "https://example.com":
        site_url = infer_base_url_from_page_names(filter_all_pages())

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
    all_metadata = []

    for page in filter_all_pages():
        label_entries = [
            r for r in collection.get(where={"page_name": page}).get("metadatas", [])
            if r.get("label_text") and re.search(r'[a-zA-Z]', r.get("label_text"))
        ]

        if not label_entries:
            continue

        all_metadata.extend(label_entries)
        page_names.append(page)
        class_name = get_class_name(page)
        method_lines = [
            "from playwright.sync_api import Page, expect",
            f"class {class_name}:",
            "    def __init__(self, page: Page):",
            "        self.page = page",
            "",
            "    def navigate_to_site(self):",
            f"        self.page.goto('{site_url}')",
            ""
        ]

        method_set = set()

        for entry in label_entries:
            label = entry.get("intent") or entry.get("label_text", "")
            if not label:
                continue  
            safe = sanitize_identifier(label)

            if safe in {"", "the", "and", "all", "with", "of", "wo", "qty", "your", "are"}:
                continue
            if len(safe) <= 2:
                continue

            if safe.startswith("click_") or safe.startswith("fill_"):
                method_set.add((
                    f"    def {safe}(self):",
                    f"        self.page.get_by_label(\"{entry['label_text']}\").click()",
                    ""
                ))
            else:
                method_set.add((
                    f"    def fill_{safe}(self, value):",
                    f"        self.page.get_by_label(\"{entry['label_text']}\").fill(value)",
                    ""
                ))
                method_set.add((
                    f"    def click_{safe}(self):",
                    f"        self.page.get_by_label(\"{entry['label_text']}\").click()",
                    ""
                ))

        method_list = sorted(method_set)[:10]
        flat_lines = [line for method in method_list for line in method]
        method_lines += flat_lines

        (pages_dir / f"{page}_page.py").write_text("\n".join(method_lines), encoding="utf-8")

        method_names = [
            line.split("(")[0].strip().replace("def ", "")
            for line in flat_lines
            if line.strip().startswith("def ")
        ]
        method_map[page] = method_names

    if not method_map:
        return {"manual_testcase": "", "auto_testcase": "# No label_text found in ChromaDB"}

    test_code = generate_test_code_from_methods(user_story, method_map, page_names, site_url)

    import_lines = ["from playwright.sync_api import sync_playwright"]
    for page in page_names:
        import_lines.append(f"from pages.{page}_page import {get_class_name(page)}")

    full_test_code = "\n".join(import_lines + [""] + [test_code])
    test_path = tests_dir / "test_from_story.py"
    test_path.write_text(full_test_code, encoding="utf-8")

    (logs_dir / "test_output.log").write_text("[SKIPPED] Execution skipped", encoding="utf-8")
    with open(meta_dir / "metadata.json", "w") as f:
        json.dump({"timestamp": timestamp, "executed": False, "metadata": all_metadata}, f, indent=2)

    return {
        "manual_testcase": f"### Manual Test Case\n\n**Objective**: {user_story}\n\n1. Navigate to site\n2. {user_story}\n\n**Expected**: The user completes the flow successfully.",
        "auto_testcase": test_code
    }
