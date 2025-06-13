from fastapi import APIRouter
from pathlib import Path
import re
from services.test_generation_utils import collection, filter_all_pages
from utils.smart_ai_utils import ensure_smart_ai_module

router = APIRouter()

def safe(s):
    """Convert label or intent to a valid python identifier."""
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
    result = {}

    for page in target_pages:
        page_data = collection.get(where={"page_name": page})
        entries = [r for r in page_data.get("metadatas", []) if r.get("label_text")]
        method_blocks = [build_method(entry) for entry in entries]
        
        # NOTE: updated to use src/pages under generated_runs
        outdir = Path("generated_runs") / "src" / "pages"
        outdir.mkdir(parents=True, exist_ok=True)
        filename = outdir / f"{page}_page_methods.py"
        
        header = (
            "from generated_runs.lib.smart_ai import patch_page_with_smartai\n\n"
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
