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
    user_story: str | list[str] = Field(..., example=["Login and add backpack to cart", "Checkout and complete order"])
    site_url: str = Field(default="")

def sanitize_identifier(label: str) -> str:
    label = label.strip().lower()
    label = re.sub(r'\s+', '_', label)
    label = re.sub(r'[^a-z0-9_]', '', label)
    label = re.sub(r'_+', '_', label)
    label = label.strip('_')
    return label if label else "element"

def clean_method_name(prefix: str, label: str) -> str:
    identifier = sanitize_identifier(label)
    return identifier if identifier.startswith(f"{prefix}_") else f"{prefix}_{identifier}"

def infer_base_url_from_page_names(page_names: list[str]) -> str:
    if not page_names:
        return "https://example.com"
    matches = [re.match(r"([a-zA-Z0-9\-]+)_", name) for name in page_names]
    domains = [m.group(1) for m in matches if m]
    if not domains:
        return "https://example.com"
    from collections import Counter
    most_common = Counter(domains).most_common(1)[0][0]
    return f"https://www.{most_common}.com"

def generate_test_code_from_methods(test_index: int, user_story: str, method_map: dict, page_names: list[str], site_url: str) -> str:
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

    page_method_section = ""
    for page in page_names:
        page_method_section += f"\n# {get_class_name(page)}:\n"
        for method in method_map[page]:
            page_method_section += f"- def {method}\n"

#     prompt = f"""
# You are a senior QA automation engineer.

# From the following user story:
# {story_block}

# Generate all possible Python test functions using Playwright and Page Object Model (POM):

# - minimum One **Positive Test Case**
# - minimum One **Negative Test Case**
# - minimum One **Edge Test Case**

# Rules:
# - Do NOT use any selectors (no page.locator, get_by_text, get_by_role).
# - Use ONLY the page object methods listed below.
# - Import from playwright.sync_api: sync_playwright
# - Instantiate page classes using: ClassName(page)
# - Launch browser using `sync_playwright()`.
# - Navigate to site using `page.goto('{site_url}')`.
# - Wrap the test in try/except, and `print("[PASS]")` or `print("[CRASH]")` on success/failure.
# - Output sample test functions:
#   - def test_story_{test_index}_positive():
#   - def test_story_{test_index}_negative():
#   - def test_story_{test_index}_edge():

# Page Object Methods:
# {page_method_section}

# Usage Hints:
# {chr(10).join(dynamic_steps)}

# Do NOT include markdown or explanations. Output valid, runnable Python only.
# """
    prompt = f"""
You are a senior QA automation engineer with end-to-end intelligence.

Your inputs are:
- A list of user stories:
{story_block}

- A set of UI page images (uploaded in any order)  
- Page object method definitions:
{page_method_section}

Your task is to generate a complete Python Playwright test suite using POM, based on the following rules:

---

✅ PAGE INTELLIGENCE:

1. For each image:
   - Identify the **page type** (e.g., login, inventory, cart, checkout) using filename, visible labels, or logical inference.
   - Store these pages as part of a sequential flow.

2. If a test involves a page like **checkout**, automatically infer and include:
   - All **required preceding steps** (e.g., login → inventory → cart → checkout)

3. Build test flows that always follow a **valid screen progression**, even if the user stories start in the middle.

---

✅ TEST GENERATION RULES:

- For each user story:
  - Generate all meaningful test cases: positive, negative, edge, boundary, validation
  - Use only available page object methods (DO NOT use selectors)
  - Reuse steps across pages using: `LoginPage(page)`, `InventoryPage(page)`, etc.
  - Launch browser via `sync_playwright()`
  - Navigate to site: `page.goto('{site_url}')`

- Function signature:
  - `def test_<feature>_<type>_<i>():`  
  - Wrap all tests in `try/except`, print `[PASS]` on success, `[CRASH]` on failure

---

✅ FILE STRUCTURE:

- Group test cases by **feature**
- Output file: `/tests/test_<feature>.py`

---

🚫 DO NOT:
- Use any selectors (no page.locator, get_by_text, etc.)
- Include markdown or explanation
- Use hardcoded assumptions — derive steps based on image sequence and story logic

✅ ADDITIONAL USAGE HINTS:
{chr(10).join(dynamic_steps)}
"""


    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096
    )

    test_code = result.choices[0].message.content.strip()
    test_code = re.sub(r"```python|```", "", test_code).strip()

    # Clean known invalid patterns from GPT output
    test_code = re.sub(r"^\s*Here is.*?:", "", test_code)  # Remove "Here is your code:"
    test_code = test_code.replace("```", "")
    test_code = re.sub(r"\n+", "\n", test_code).strip()  # Remove excess blank lines

    return test_code

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    stories = req.user_story if isinstance(req.user_story, list) else [req.user_story]

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

    debug_lines = []
    debug_lines.append(f"🎯 Site URL: {site_url}")
    page_names = []
    method_map = {}
    all_metadata = []

    for page in filter_all_pages():
        debug_lines.append(f"\n🔵 Processing Page: {page}")
        # Fetch fresh metadatas from ChromaDB (ensures ocr_type is present)
        page_metadatas = collection.get(where={"page_name": page})
        label_entries = [
            r for r in page_metadatas.get("metadatas", [])
            if r.get("label_text") and re.search(r'[a-zA-Z]', r.get("label_text"))
        ]
        if not label_entries:
            debug_lines.append("  ⚠️ No valid label entries found.")
            continue
        all_metadata.extend(page_metadatas["metadatas"])

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
            if safe in {"", "the", "and", "all", "with", "of", "wo", "qty", "your", "are"} or len(safe) <= 2:
                debug_lines.append(f"  ⚠️ Skipped label: '{label}' → '{safe}' (too generic or short)")
                continue

            intent = entry.get("intent", "").lower()
            label_text = entry.get("label_text", "")
            label_lower = label_text.lower()

            if intent.startswith("fill_") or any(k in label_lower for k in ["username", "password", "name", "email", "code", "address", "zip"]):
                method_name = clean_method_name("fill", label)
                method_set.add((
                    f"    def {method_name}(self, value):",
                    f"        self.page.get_by_label(\"{label_text}\").fill(value)",
                    ""
                ))
                debug_lines.append(f"  ✅ Generated (fill): {method_name}(value)")
            else:
                method_name = clean_method_name("click", label)
                method_set.add((
                    f"    def {method_name}(self):",
                    f"        self.page.get_by_role(\"button\", name=\"{label_text}\").click()",
                    ""
                ))
                debug_lines.append(f"  ✅ Generated (click): {method_name}()")

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
        return {"results": []}

    import_lines = ["from playwright.sync_api import sync_playwright"]
    for page in page_names:
        import_lines.append(f"from pages.{page}_page import {get_class_name(page)}")

    results = []
    test_functions = []

    for i, story in enumerate(stories):
        story_lower = story.lower()
        if any(w in story_lower for w in ["fail", "invalid", "wrong", "error", "unsuccessful"]):
            story_type = "Negative"
        elif any(w in story_lower for w in ["limit", "boundary", "max", "min", "edge"]):
            story_type = "Edge"
        else:
            story_type = "Positive"
        debug_lines.append(f"\n🟡 Generating test for story {i+1}: '{story}' [{story_type}]")

        test_code = generate_test_code_from_methods(i + 1, story, method_map, page_names, site_url)
        test_functions.append(test_code)
        results.append({
            "manual_testcase": f"### Manual Test Case {i+1} ({story_type})\n\n**Objective**: {story}\n\n1. Navigate to site\n2. {story}\n\n**Expected**: The user completes the flow successfully.",
            "auto_testcase": test_code,
            "story_type": story_type
        })

    full_test_code = "\n\n".join(import_lines + test_functions)
    (tests_dir / "test_from_story.py").write_text(full_test_code, encoding="utf-8")
    (logs_dir / "test_output.log").write_text("[SKIPPED] Execution skipped", encoding="utf-8")
    (logs_dir / "debug.log").write_text("\n".join(debug_lines), encoding="utf-8")
    with open(meta_dir / "metadata.json", "w") as f:
        json.dump({"timestamp": timestamp, "executed": False, "metadata": all_metadata}, f, indent=2)

    return {"results": results}
