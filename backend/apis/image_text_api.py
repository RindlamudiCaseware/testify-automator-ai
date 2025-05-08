from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import zipfile
import tempfile
import os
from PIL import Image
from logic.image_text_extractor import process_image
from config.settings import DATA_PATH

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

# Initialize ChromaDB client
embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection(
    name="ocr_images",
    embedding_function=embedding_function
)

router = APIRouter()

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        filename = file.filename.lower()
        results = []

        if filename.endswith(".zip"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_zip:
                tmp_zip.write(await file.read())
                tmp_zip_path = tmp_zip.name

            with zipfile.ZipFile(tmp_zip_path, 'r') as zip_ref:
                with tempfile.TemporaryDirectory() as extract_dir:
                    zip_ref.extractall(extract_dir)
                    for image_name in zip_ref.namelist():
                        if image_name.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp")):
                            image_path = os.path.join(extract_dir, image_name)
                            try:
                                with Image.open(image_path) as img:
                                    process_results = await process_image(img.copy(), filename=image_name, base_folder=extract_dir)

                                    for entry in process_results:
                                        # ✅ Inject type: ocr
                                        entry["type"] = "ocr"
                                        entry["region_image_path"] = image_path
                                        # Insert into ChromaDB
                                        chroma_collection.add(
                                            ids=[entry["ocr_id"]],
                                            documents=[entry["text"]],
                                            metadatas=[entry]
                                        )
                                        results.append(entry)

                            except Exception as img_err:
                                print(f"⚠️ Skipping {image_name}: {img_err}")

        elif filename.endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp")):
            with Image.open(file.file) as img:
                process_results = await process_image(img.copy(), filename=file.filename)

                for entry in process_results:
                    entry["type"] = "ocr"
                    entry["region_image_path"] = file.filename
                    chroma_collection.add(
                        ids=[entry["ocr_id"]],
                        documents=[entry["text"]],
                        metadatas=[entry]
                    )
                    results.append(entry)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Upload image or ZIP of images.")

        return JSONResponse(content={"status": "success", "data": results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
