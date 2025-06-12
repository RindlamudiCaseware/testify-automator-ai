from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os, sys, subprocess, json
from datetime import datetime
from pathlib import Path

router = APIRouter()

project_root = Path(__file__).resolve().parents[1]
generated_runs_dir = project_root / "generated_runs"
tests_dir = generated_runs_dir / "tests"
logs_dir = generated_runs_dir / "logs"
meta_dir = generated_runs_dir / "metadata"

@router.post("/rag/run-generated-story-test")
def run_latest_generated_story_test():
    try:
        # 1. Find the latest test file in generated_runs/tests/
        test_files = sorted(
            [f for f in tests_dir.glob("test_*.py") if f.is_file()],
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        if not test_files:
            raise HTTPException(status_code=404, detail="No generated test files found.")
        latest_test_path = test_files[0]

        # 2. Prepare logs and metadata paths
        logs_dir.mkdir(parents=True, exist_ok=True)
        meta_dir.mkdir(parents=True, exist_ok=True)
        log_file = logs_dir / f"test_output_{latest_test_path.stem}.log"
        meta_file = meta_dir / f"execution_metadata_{latest_test_path.stem}.json"

        # 3. Run the test using subprocess (ensure imports work from run dir)
        result = subprocess.run(
            [sys.executable, str(latest_test_path)],
            cwd=generated_runs_dir,
            env={**os.environ, "PYTHONPATH": str(generated_runs_dir)},
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        output = result.stdout + result.stderr
        log_file.write_text(output, encoding="utf-8")
        status = "PASS" if result.returncode == 0 and "[PASS]" in output else "FAIL"

        json.dump(
            {"status": status, "timestamp": datetime.now().isoformat()},
            open(meta_file, "w"), indent=2
        )

        return {
            "status": status,
            "log": output,
            "executed_from": str(latest_test_path),
            "log_file": str(log_file),
            "meta_file": str(meta_file),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
