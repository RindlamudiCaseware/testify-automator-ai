from pathlib import Path

def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_project_root(project_name, script_generator, language):
    return ensure_dir(Path("projects") / project_name / f"{script_generator}_{language}")

def get_src_dir(project_name, script_generator, language):
    return ensure_dir(get_project_root(project_name, script_generator, language) / "src")

def get_pages_dir(project_name, script_generator, language):
    return ensure_dir(get_src_dir(project_name, script_generator, language) / "pages")

def get_tests_dir(project_name, script_generator, language):
    return ensure_dir(get_src_dir(project_name, script_generator, language) / "tests")

def get_images_dir(project_name, script_generator, language):
    return ensure_dir(get_project_root(project_name, script_generator, language) / "images")

def get_db_dir(project_name, script_generator, language):
    return ensure_dir(get_project_root(project_name, script_generator, language) / "db")

def get_metadata_dir(project_name, script_generator, language):
    return ensure_dir(get_project_root(project_name, script_generator, language) / "metadata")
