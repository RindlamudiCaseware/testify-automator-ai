from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from utils.project_paths import get_project_root
from services.chroma_service import upsert_project_config

router = APIRouter()

class CreateProjectRequest(BaseModel):
    project_name: str
    framework: str
    language: str

@router.post("/create_project")
def create_project(req: CreateProjectRequest):
    # Get root dir for project
    project_dir = get_project_root(req.project_name, req.framework, req.language)
    project_dir.mkdir(parents=True, exist_ok=True)

    config = {
        "project_name": req.project_name,
        "framework": req.framework,
        "language": req.language
    }

    config_path = project_dir / "project_config.json"
    config_path.write_text(json.dumps(config, indent=2))

    
    # Store project in ChromaDB too
    upsert_project_config(req.project_name, req.framework, req.language)

    return {
        "success": True,
        "project_dir": str(project_dir.resolve()),
        "config_path": str(config_path.resolve())
    }
