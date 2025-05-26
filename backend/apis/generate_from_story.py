import os
import sys
import re
import subprocess
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from utils.match_utils import normalize_page_name
from services.test_generation_utils import client, get_class_name, filter_all_pages, collection

router = APIRouter()

class UserStoryRequest(BaseModel):
    user_story: str

@router.post("/rag/generate-from-story")
def generate_from_user_story(req: UserStoryRequest):
    user_story = req.user_story
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    project_root = Path(__file__).resolve().parents[1]
    run_folder = project_root / "generated_runs" / f"story_{timestamp}"
    tests_dir = run_folder / "tests"
    logs_dir = run_folder / "logs"
    pages_dir = project_root / "generated_runs" / "pages"

    for d in [tests_dir, logs_dir]:
        d.mkdir(parents=True, exist_ok=True)
    (tests_dir / "__init__.py").touch()
    (run_folder / "__init__.py").touch()

    # Dynamically import correct page object classes
    import_lines = ["from playwright.sync_api import sync_playwright"]
    page_names = filter_all_pages()
    for page in page_names:
        import_lines.append(f"from pages.{page}_page import {get_class_name(page)}")

    # Build GPT prompt
    prompt = f"""
You are a senior QA automation engineer.

Generate a complete Python Playwright test function called `test_end_to_end()` based on the user story below.

Use synchronous Playwright API (`from playwright.sync_api import sync_playwright`), not async/await.

User Story:
\"\"\"{user_story}\"\"\"

Use only the following page classes and assume they are already imported:
{', '.join(get_class_name(page) for page in page_names)}

Do not define any page classes. Only return the test function body and main runner block using `sync_playwright()`.
"""


    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )

    test_code = result.choices[0].message.content.strip()

    # Remove triple backticks and markdown language hint
    if test_code.startswith("```"):
        lines = test_code.splitlines()
        test_code = "\n".join(line for line in lines if not line.strip().startswith("```"))

    # Optionally truncate after main function to avoid explanations
    if "# Main runner block" in test_code:
        test_code = test_code.split("# Main runner block")[0] + "# Main runner block\nif __name__ == \"__main__\":\n    test_end_to_end()"

    # Final fallback: remove last non-code lines (e.g., plain English)
    test_code_lines = test_code.splitlines()
    valid_lines = []
    for line in test_code_lines:
        if line.strip() == "":
            valid_lines.append(line)
            continue
        if re.match(r"^[a-zA-Z]", line) and not line.lstrip().startswith(("def ", "class ", "import ", "from ", "#", '"', "'")):
            break  # stop at first non-code line
        valid_lines.append(line)
    test_code = "\n".join(valid_lines)

    test_path = tests_dir / "test_from_story.py"
    full_test = "\n".join(import_lines + [""] + [test_code])
    test_path.write_text(full_test, encoding="utf-8")

    # Run it safely
    result = subprocess.run(
        [sys.executable, str(test_path)],
        cwd=run_folder,
        env={**os.environ, "PYTHONPATH": str(project_root / "generated_runs")},
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    output = result.stdout + result.stderr
    (logs_dir / "test_output.log").write_text(output, encoding="utf-8")

    return {
        "status": "PASS" if "[PASS]" in output else "FAIL",
        "user_story": user_story,
        "test_path": str(test_path),
        "test_output": output
    }
