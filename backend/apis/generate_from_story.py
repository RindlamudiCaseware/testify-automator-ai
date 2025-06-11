from fastapi import APIRouter
from pathlib import Path
import re
import json
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter()

class UserStoryRequest(BaseModel):
    user_story: str | List[str] = Field(..., example=["Login and add backpack", "Checkout and complete order"])
    prompt: str = Field(..., example="Custom prompt with {story_block}, {page_method_section}, {site_url}, {dynamic_steps}")
    site_url: Optional[str] = Field(default="https://www.saucedemo.com")

def extract_method_names_from_file(file_path):
    """Extract all function names from a Python file."""
    method_names = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r"def\s+([a-zA-Z_][a-zA-Z0-9_]*)\(", line)
            if m:
                method_names.append(m.group(1))
    return method_names

def get_all_page_methods(pages_dir):
    """Get all method names for each page file in /pages."""
    page_method_map = {}
    for py_file in Path(pages_dir).glob("*_page_methods.py"):
        page_name = py_file.stem.replace("_page_methods", "")
        page_method_map[page_name] = extract_method_names_from_file(py_file)
    return page_method_map

def next_index(target_dir, pattern="test_{}.py"):
    """Returns the next index for naming test/log files, e.g., test_1.py, test_2.py."""
    files = list(target_dir.glob(pattern.format("*")))
    indices = []
    for f in files:
        m = re.match(r".*_(\d+)\.", f.name)
        if m:
            indices.append(int(m.group(1)))
    return max(indices, default=0) + 1

# --- LEGACY: Only for future reference (not used, see comments why) ---
'''
# If you ever want to regenerate method names from metadata (e.g., for disaster recovery),
# you could use the commented block below. Not recommended for test codegen,
# as it may cause a mismatch between code and prompt.
def safe(s):
    return re.sub(r'\W+', '_', s.lower()).strip('_')
def build_method(entry):
    # ...your old build_method implementation...
    pass
'''

@router.post("/rag/generate-from-story")
def generate_from_user_story(req:UserStoryRequest):
    """
    Generate test cases using only the real, implemented methods from /generated_runs/pages.
    Each run will produce a new test_N.py and logs_N.log.
    Metadata is only generated if not already present.
    """
    run_folder = Path("generated_runs")
    pages_dir = run_folder / "pages"
    tests_dir = run_folder / "tests"
    logs_dir = run_folder / "logs"
    meta_dir = run_folder / "metadata"

    for d in [tests_dir, logs_dir, meta_dir]:
        d.mkdir(parents=True, exist_ok=True)
    for d in [tests_dir]:
        (d / "__init__.py").touch()

    # Use real, implemented method names:
    method_map = get_all_page_methods(pages_dir)
    page_names = list(method_map.keys())

    # Compose page_method_section for the prompt:
    page_method_section = ""
    for page in page_names:
        page_method_section += f"\n# {page}:\n"
        for method in method_map[page]:
            page_method_section += f"- def {method}\n"

    # Compose imports for the test script:
    import_lines = ["from playwright.sync_api import sync_playwright"] + [
        f"from pages.{page}_page_methods import *" for page in page_names
    ]

    stories = req.user_story if isinstance(req.user_story, list) else [req.user_story]
    site_url = getattr(req, "site_url", "https://www.saucedemo.com")  # Use provided or default

    def generate_test_code_from_methods(user_story, method_map, page_names, site_url, prompt_template):
        dynamic_steps = []
        for methods in method_map.values():
            for method in methods:
                if method.startswith("fill_"):
                    dynamic_steps.append(f"    - Call `{method}(\"<{method.replace('fill_', '')}>\")`")
                elif method.startswith("click_"):
                    dynamic_steps.append(f"    - Call `{method}()`")
        user_story_clean = user_story.replace('"""', '\\"\\"\\"')
        story_block = f'"""{user_story_clean}"""'
        prompt = prompt_template.format(
            story_block=story_block,
            page_method_section=page_method_section,
            page_names=page_names,
            site_url=site_url,
            dynamic_steps_joined="\n".join(dynamic_steps),
        )
        from services.test_generation_utils import client
        result = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096
        )
        test_code = result.choices[0].message.content.strip()
        return re.sub(r"```(?:python)?|^\s*Here is.*?:", "", test_code, flags=re.MULTILINE).strip()

    # --- Index for new test/log files ---
    test_idx = next_index(tests_dir, "test_{}.py")
    log_idx = next_index(logs_dir, "logs_{}.log")

    test_functions, results = [], []

    for i, story in enumerate(stories):
        user_story_clean = story.replace('"""', '\\"\\"\\"')
        code = generate_test_code_from_methods(
            story, method_map, page_names, site_url, req.prompt
        )
        test_functions.append(code)
        results.append({
            "manual_testcase": f"### Manual Test Case {i+1}\n\n1. Navigate\n2. {story}\nExpected: Success",
            "auto_testcase": code,
        })

    # --- Write files for this run ---
    test_file = tests_dir / f"test_{test_idx}.py"
    log_file = logs_dir / f"logs_{log_idx}.log"

    test_file.write_text("\n\n".join(import_lines + test_functions), encoding="utf-8")
    log_file.write_text("\n".join(page_names), encoding="utf-8")

    # --- Generate metadata only once ---
    meta_file = meta_dir / "metadata.json"
    if not meta_file.exists():
        metadata = {
            "timestamp": test_file.stat().st_mtime,
            "pages": page_names,
            "method_map": method_map,
            "test_files": [str(test_file.name)],
            "log_files": [str(log_file.name)],
        }
        json.dump(metadata, open(meta_file, "w"), indent=2)
    else:
        # Optionally, append to test_files/log_files in metadata if you want a full history
        pass

    return {"results": results, "test_file": str(test_file), "log_file": str(log_file)}
