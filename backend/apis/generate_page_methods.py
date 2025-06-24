from fastapi import APIRouter
from pathlib import Path
import re
from services.test_generation_utils import collection, filter_all_pages
from utils.smart_ai_utils import ensure_smart_ai_module

router = APIRouter()

def safe(s):
    return re.sub(r'\W+', '_', s.lower()).strip('_')

def build_method(entry):
    ocr_type = (entry.get("ocr_type") or "").lower()
    intent = (entry.get("intent") or "").lower()
    label_text = entry.get("label_text", "")
    unique_name = entry.get("unique_name")

    if ocr_type == "textbox":
        func_name = f"enter_{safe(label_text or intent)}"
        code = (
            f"def {func_name}(page, value):\n"
            f"    page.smartAI('{unique_name}').fill(value)\n"
        )
    elif ocr_type == "button":
        func_name = f"click_{safe(label_text or intent)}"
        code = (
            f"def {func_name}(page):\n"
            f"    page.smartAI('{unique_name}').click()\n"
        )
    elif ocr_type == "select":
        func_name = f"select_{safe(label_text or intent)}"
        code = (
            f"def {func_name}(page, value):\n"
            f"    page.smartAI('{unique_name}').select_option(value)\n"
        )
    elif ocr_type == "checkbox":
        func_name = f"toggle_{safe(label_text or intent)}"
        code = (
            f"def {func_name}(page):\n"
            f"    page.smartAI('{unique_name}').click()\n"
        )
    else:
        func_name = f"verify_{safe(label_text or intent)}"
        code = (
            f"def {func_name}(page):\n"
            f"    assert page.smartAI('{unique_name}').is_visible()\n"
        )
    return code

@router.post("/rag/generate-page-methods")
def generate_page_methods():
    ensure_smart_ai_module()
    target_pages = filter_all_pages()
    print("apis.generate_page_methods.py | target_pages = ", target_pages)
    result = {}

    # Setting the path and content for conftest.py 
    def create_conftest_file():
        conftest_content = '''import pytest
import json
from pathlib import Path
from lib.smart_ai import patch_page_with_smartai

@pytest.fixture(autouse=True)
def smartai_page(page):    
    # Get the path to THIS FILE's directory
    script_dir = Path(__file__).parent
    # Go up one to 'src', then into 'metadata'
    metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()

    print("Loading:", metadata_path)  # Debug, can remove

    with open(metadata_path, "r") as f:
        actual_metadata = json.load(f)
    patch_page_with_smartai(page, actual_metadata)
    return page
'''


        # Navigate from /apis/ to /generated_runs/src/tests
        tests_dir = Path(__file__).parent.parent / "generated_runs" / "src" / "tests"
        tests_dir.mkdir(parents=True, exist_ok=True)

        conftest_path = tests_dir / "conftest.py"
        conftest_path.write_text(conftest_content.strip())
        print(f"✅ conftest.py created at: {conftest_path}")
    # Creating conftest.py
    create_conftest_file()


    for page in target_pages:
        page_data = collection.get(where={"page_name": page})
        entries = [r for r in page_data.get("metadatas", []) if r.get("label_text")]
        method_blocks = [build_method(entry) for entry in entries]
        
        outdir = Path("generated_runs") / "src" / "pages"
        outdir.mkdir(parents=True, exist_ok=True)
        filename = outdir / f"{page}_page_methods.py"

        header = (
            "from lib.smart_ai import patch_page_with_smartai\n\n" 
            "# Assumes `page` has been patched already with patch_page_with_smartai(page, metadata)\n\n"
        )
        code = header + "\n".join(method_blocks)

        with open(filename, "w", encoding="utf-8") as f:
            f.write(code)

        result[page] = {
            "filename": str(filename),
            "code": code
        }

    return result
