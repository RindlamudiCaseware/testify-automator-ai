import os
import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

router = APIRouter()

project_root = Path(__file__).resolve().parents[1]
generated_runs_dir = project_root / "generated_runs"

@router.post("/rag/run-generated-story-test")
def run_latest_generated_story_test():
    try:
        story_folders = sorted(
            [f for f in generated_runs_dir.glob("story_*") if f.is_dir()],
            key=lambda x: x.name,
            reverse=True
        )
        if not story_folders:
            raise HTTPException(status_code=404, detail="No generated story folders found.")

        latest_story_dir = story_folders[0]
        test_path = latest_story_dir / "tests" / "test_from_story.py"
        logs_dir = latest_story_dir / "logs"
        meta_dir = latest_story_dir / "metadata"

        if not test_path.exists():
            raise HTTPException(status_code=404, detail="Test file not found in latest story folder.")

        result = subprocess.run(
            [sys.executable, str(test_path)],
            cwd=latest_story_dir,
            env={**os.environ, "PYTHONPATH": str(latest_story_dir)},
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        output = result.stdout + result.stderr
        logs_dir.mkdir(parents=True, exist_ok=True)
        meta_dir.mkdir(parents=True, exist_ok=True)

        (logs_dir / "test_output.log").write_text(output, encoding="utf-8")
        status = "PASS" if result.returncode == 0 and "[PASS]" in output else "FAIL"

        json.dump({"status": status, "timestamp": datetime.now().isoformat()}, open(meta_dir / "execution_metadata.json", "w"))

        return {
            "status": status,
            "log": output,
            "executed_from": str(test_path)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/download-zip")
def download_zip(path: str = Query(...)):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="ZIP not found")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/zip")
