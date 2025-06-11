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
    user_story: str | list[str] = Field(..., example=["Login and add backpack", "Checkout and complete order"])
    prompt: str = Field(..., example="Custom prompt with {story_block}, {page_method_section}, {site_url}, {dynamic_steps}")
    user_story: str | list[str] = Field(..., example=["Login and add backpack", "Checkout and complete order"])
    prompt: str = Field(..., example="Custom prompt with {story_block}, {page_method_section}, {site_url}, {dynamic_steps}")
    site_url: str = Field(default="")

# Helper functions
# Helper functions
def sanitize_identifier(label: str) -> str:
    label = label.strip().lower()
    label = re.sub(r'\s+', '_', label)
    label = re.sub(r'[^a-z0-9_]', '', label)
    return re.sub(r'_+', '_', label).strip('_')
    return re.sub(r'_+', '_', label).strip('_')

def clean_method_name(prefix: str, label: str) -> str:
    identifier = sanitize_identifier(label)
    return identifier if identifier.startswith(f"{prefix}_") else f"{prefix}_{identifier}"

def infer_base_url_from_page_names(page_names: list[str]) -> str:
    from collections import Counter
    if not page_names: return "https://example.com"
    domains = [re.match(r"([a-zA-Z0-9\-]+)_", name).group(1) for name in page_names if re.match(r"([a-zA-Z0-9\-]+)_", name)]
    most_common = Counter(domains).most_common(1)[0][0] if domains else "example"
    if not page_names: return "https://example.com"
    domains = [re.match(r"([a-zA-Z0-9\-]+)_", name).group(1) for name in page_names if re.match(r"([a-zA-Z0-9\-]+)_", name)]
    most_common = Counter(domains).most_common(1)[0][0] if domains else "example"
    return f"https://www.{most_common}.com"

def generate_test_code_from_methods(test_index, user_story, method_map, page_names, site_url, prompt_template, default_username="", default_password="") -> str:
    escaped_story = user_story.replace('"""', '\"\"\"')
def generate_test_code_from_methods(test_index, user_story, method_map, page_names, site_url, prompt_template, default_username="", default_password="") -> str:
    escaped_story = user_story.replace('"""', '\"\"\"')
    story_block = f'"""{escaped_story}"""'

    dynamic_steps = []
    for methods in method_map.values():
    for methods in method_map.values():
        for method in methods:
            if method.startswith("fill_"):
                dynamic_steps.append(f"    - Call `{method}(\"<{method.replace('fill_', '')}>\")`")
                dynamic_steps.append(f"    - Call `{method}(\"<{method.replace('fill_', '')}>\")`")
            elif method.startswith("click_"):
                dynamic_steps.append(f"    - Call `{method}()`")

    page_method_section = ""
    for page in page_names:
        page_method_section += f"\n# {get_class_name(page)}:\n"
        for method in method_map[page]:
            page_method_section += f"- def {method}\n"

    prompt = prompt_template.format(
        story_block=user_story,
        page_method_section=page_method_section,
        page_names=page_names,
        site_url=site_url,
        default_username=default_username,
        default_password=default_password,
        dynamic_steps_joined="\n".join(dynamic_steps)
    )


    if "standard_user" in default_username.lower():
        prompt += "\n\nNote: Use credentials 'standard_user' and 'secret_sauce' for login."
    prompt = prompt_template.format(
        story_block=user_story,
        page_method_section=page_method_section,
        page_names=page_names,
        site_url=site_url,
        default_username=default_username,
        default_password=default_password,
        dynamic_steps_joined="\n".join(dynamic_steps)
    )


    if "standard_user" in default_username.lower():
        prompt += "\n\nNote: Use credentials 'standard_user' and 'secret_sauce' for login."

    result = client.chat.completions.create(
        model="gpt-4o",
        # model="openai/o4-mini",
        # model="openai/o4-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096
    )

    test_code = result.choices[0].message.content.strip()
    return re.sub(r"```(?:python)?|^\s*Here is.*?:", "", test_code, flags=re.MULTILINE).strip()
    return re.sub(r"```(?:python)?|^\s*Here is.*?:", "", test_code, flags=re.MULTILINE).strip()

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    stories = req.user_story if isinstance(req.user_story, list) else [req.user_story]
    site_url = req.site_url or infer_base_url_from_page_names(filter_all_pages())
    site_url = req.site_url or infer_base_url_from_page_names(filter_all_pages())

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_folder = Path("generated_runs") / f"story_{timestamp}"
    pages_dir, tests_dir, logs_dir, meta_dir = [run_folder / name for name in ["pages", "tests", "logs", "metadata"]]
    for d in [pages_dir, tests_dir, logs_dir, meta_dir]: d.mkdir(parents=True, exist_ok=True)
    for d in [run_folder, pages_dir, tests_dir]: (d / "__init__.py").touch()
    
    # run_folder = Path("generated_runs")
    # pages_dir = run_folder / "pages"
    # tests_dir = run_folder / "tests"
    # tests_dir.mkdir(parents=True, exist_ok=True)
    # pages_dir.mkdir(parents=True, exist_ok=True)

    page_names, method_map, all_metadata = [], {}, []
    default_username, default_password = "", ""

    # for page in filter_all_pages():
    #     page_data = collection.get(where={"page_name": page})
    #     entries = [r for r in page_data.get("metadatas", []) if r.get("label_text") and re.search(r"[a-zA-Z]", r["label_text"])]
    #     if not entries: continue
    #     page_names.append(page)
    #     all_metadata.extend(entries)

        # class_name = get_class_name(page)
        # methods = ["from playwright.sync_api import Page", f"class {class_name}:", "    def __init__(self, page):", "        self.page = page", "", "    def navigate_to_site(self):", f"        self.page.goto('{site_url}')", ""]

        # method_set = set()
        # for entry in entries:
        #     label = entry.get("intent") or entry.get("label_text", "")
        #     safe = sanitize_identifier(label)
        #     if not safe or safe in {"the", "and", "of", "your"} or len(safe) <= 2: continue

        #     intent = entry.get("intent", "").lower()
        #     label_text = entry.get("label_text", "").lower()
        #     if "standard_user" in label_text: default_username = "standard_user"
        #     if "secret_sauce" in label_text: default_password = "secret_sauce"

        #     if "fill" in intent or any(x in label_text for x in ["username", "password", "email", "code"]):
        #         name = clean_method_name("fill", label)
        #         method_set.add((f"    def {name}(self, value):", f"        self.page.get_by_label(\"{label}\").fill(value)", ""))
        #     else:
        #         name = clean_method_name("click", label)
        #         method_set.add((f"    def {name}(self):", f"        self.page.get_by_role(\"button\", name=\"{label}\").click()", ""))

        # flat = [line for tup in sorted(method_set)[:10] for line in tup]
        # methods += flat
        # (pages_dir / f"{page}_page.py").write_text("\n".join(methods), encoding="utf-8")
        # method_map[page] = [line.split("(")[0].replace("def ", "").strip() for line in flat if line.startswith("    def ")]

    import_lines = ["from playwright.sync_api import sync_playwright"] + [f"from pages.{page}_page import {get_class_name(page)}" for page in page_names]
    test_functions, results = [], []
    import_lines = ["from playwright.sync_api import sync_playwright"] + [f"from pages.{page}_page import {get_class_name(page)}" for page in page_names]
    test_functions, results = [], []

    for i, story in enumerate(stories):
        story_type = "Negative" if any(x in story.lower() for x in ["fail", "invalid"]) else "Edge" if "limit" in story.lower() else "Positive"
        code = generate_test_code_from_methods(i + 1, story, method_map, page_names, site_url, req.prompt, default_username, default_password)
        test_functions.append(code)
        story_type = "Negative" if any(x in story.lower() for x in ["fail", "invalid"]) else "Edge" if "limit" in story.lower() else "Positive"
        code = generate_test_code_from_methods(i + 1, story, method_map, page_names, site_url, req.prompt, default_username, default_password)
        test_functions.append(code)
        results.append({
            "manual_testcase": f"### Manual Test Case {i+1} ({story_type})\n\n1. Navigate\n2. {story}\nExpected: Success",
            "auto_testcase": code,
            "manual_testcase": f"### Manual Test Case {i+1} ({story_type})\n\n1. Navigate\n2. {story}\nExpected: Success",
            "auto_testcase": code,
            "story_type": story_type
        })


    # Write to tests folder as test_{N}.py
    idx = next_test_index(tests_dir)
    out_file = tests_dir / f"test_{idx}.py"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write_text("\n\n".join(import_lines + test_functions), encoding="utf-8")

    # (tests_dir / "test_from_story.py").write_text("\n\n".join(import_lines + test_functions), encoding="utf-8")
    # (logs_dir / "debug.log").write_text("\n".join(page_names), encoding="utf-8")
    # json.dump({"timestamp": timestamp, "executed": False, "metadata": all_metadata}, open(meta_dir / "metadata.json", "w"), indent=2)

    return {"results": results}
