from fastapi import APIRouter
from pathlib import Path
import re
import json
import ast
from pydantic import BaseModel, Field
from typing import List, Optional
from services.graph_service import read_dependency_graph, get_adjacency_list, find_path
from services.test_generation_utils import openai_client 
from utils.match_utils import normalize_page_name
from utils.prompt_utils import build_prompt

from chromadb import PersistentClient
chroma_client = PersistentClient(path="./data/chroma_db")
collection = chroma_client.get_or_create_collection(name="element_metadata")

router = APIRouter()

class UserStoryRequest(BaseModel):
    user_story: str | List[str]
    site_url: Optional[str] = Field(default="https://www.example.com")

def create_default_test_data(run_folder):
    data = {
        "login": {
            "username": "standard_user",
            "password": "secret_sauce"
        },
        "checkout": {
            "first_name": "John",
            "last_name": "Doe",
            "zip_code": "12345"
        },
        "product": {
            "name": "Sauce Labs Backpack"
        }
    }
    data_dir = Path(run_folder) / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    with open(data_dir / "test_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def extract_method_names_from_file(file_path):
    method_names = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r"def\s+([a-zA-Z_][a-zA-Z0-9_]*)\(", line)
            if m:
                method_names.append(m.group(1))
    return method_names

def get_all_page_methods(pages_dir):
    page_method_map = {}
    for py_file in Path(pages_dir).glob("*_page_methods.py"):
        page_name = py_file.stem.replace("_page_methods", "")
        page_method_map[page_name] = extract_method_names_from_file(py_file)
    return page_method_map

def next_index(target_dir, pattern="test_{}.py"):
    files = list(target_dir.glob(pattern.format("*")))
    indices = [int(m.group(1)) for f in files if (m := re.match(r".*_(\d+)\.", f.name))]
    return max(indices, default=0) + 1

def generate_test_code_from_methods(user_story, method_map, page_names, site_url):
    dynamic_steps = []
    for methods in method_map.values():
        for method in methods:
            if method.startswith("fill_"):
                dynamic_steps.append(f"    - Call `{method}(\"<{method.replace('fill_', '')}>\")`")
            elif method.startswith("click_"):
                dynamic_steps.append(f"    - Call `{method}()`")
    user_story_clean = user_story.replace('"""', '\"\"\"')
    story_block = f'"""{user_story_clean}"""'

    prompt = build_prompt(
        story_block=story_block,
        method_map=method_map,
        page_names=page_names,
        site_url=site_url,
        dynamic_steps=dynamic_steps
    )

    # Use the correct OpenAI client here!
    result = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096
    )
    return re.sub(r"```(?:python)?|^\s*Here is.*?:", "", result.choices[0].message.content.strip(), flags=re.MULTILINE).strip()

def get_inferred_pages(user_story: str, method_map_full: dict, openai_client):
    page_list_str = "\n".join(
        [f"{i+1}. {k.replace('_', ' ')}" for i, k in enumerate(method_map_full.keys())]
    )
    prompt = f"""
You are an expert QA automation engineer.

Given the following available application pages:
{page_list_str}

Here is a user story:
\"\"\"{user_story}\"\"\"

Output ONLY a Python list (in order) of the page keys (use the keys exactly as shown) that must be visited for this story. Do not explain.
"""
    result = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
    )
    output = result.choices[0].message.content.strip()
    try:
        inferred_pages = ast.literal_eval(output)
        # Only keep keys that exist in your map
        return [p for p in inferred_pages if p in method_map_full]
    except Exception:
        # fallback: just return all page keys if anything goes wrong
        return list(method_map_full.keys())

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    run_folder = Path("generated_runs") / "src"
    pages_dir = run_folder / "pages"
    tests_dir = run_folder / "tests"
    logs_dir = run_folder / "logs"
    meta_dir = run_folder / "metadata"
    for d in [tests_dir, logs_dir, meta_dir]:
        d.mkdir(parents=True, exist_ok=True)
    (tests_dir / "__init__.py").touch()

    # Save all ChromaDB metadata as before_enrichment.json before running test generation
    all_chroma_data = collection.get()
    all_chroma_metadatas = all_chroma_data.get("metadatas", [])

    meta_dir = Path("generated_runs") / "src" / "metadata"
    meta_dir.mkdir(parents=True, exist_ok=True)
    before_file = meta_dir / "before_enrichment.json"
    with open(before_file, "w", encoding="utf-8") as f:
        json.dump(all_chroma_metadatas, f, indent=2)

    method_map_full = get_all_page_methods(pages_dir)

    stories = req.user_story if isinstance(req.user_story, list) else [req.user_story]
    results, test_functions = [], []
    all_path_pages = []

    for story in stories:
        path_pages = get_inferred_pages(story, method_map_full, openai_client)
        if not path_pages:
            continue
        all_path_pages.extend(path_pages)
        sub_method_map = {p: method_map_full[p] for p in path_pages if p in method_map_full}
        code = generate_test_code_from_methods(story, sub_method_map, path_pages, req.site_url)
        test_functions.append(code)
        results.append({
            "manual_testcase": f"### Manual Test Case\n\n1. {story}\nExpected: Success",
            "auto_testcase": code,
        })

    test_idx = next_index(tests_dir, "test_{}.py")
    log_idx = next_index(logs_dir, "logs_{}.log")
    test_file = tests_dir / f"test_{test_idx}.py"
    log_file = logs_dir / f"logs_{log_idx}.log"

    page_method_files = sorted((pages_dir).glob("*_page_methods.py"))
    import_lines = ["from playwright.sync_api import sync_playwright"]
    for file in page_method_files:
        module_name = file.stem  
        import_lines.append(f"from pages.{module_name} import *")

    test_file.write_text("\n\n".join(import_lines + test_functions), encoding="utf-8")

    if all_path_pages:
        log_file.write_text("\n".join(all_path_pages), encoding="utf-8")
    else:
        log_file.write_text("No stories were processed.", encoding="utf-8")

    meta_file = meta_dir / "metadata.json"
    if not meta_file.exists():
        metadata = {
            "timestamp": test_file.stat().st_mtime,
            "pages": all_path_pages,
            "test_files": [str(test_file.name)],
            "log_files": [str(log_file.name)],
        }
        json.dump(metadata, open(meta_file, "w"), indent=2)
    
    create_default_test_data(run_folder)

    return {"results": results, "test_file": str(test_file), "log_file": str(log_file)}
