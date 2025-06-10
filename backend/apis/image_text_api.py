from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import zipfile
import tempfile
import os
from PIL import Image
from logic.image_text_extractor import process_image
from config.settings import DATA_PATH
from utils.file_utils import sanitize_metadata, build_standard_metadata
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from utils.match_utils import normalize_page_name

# Initialize ChromaDB
embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./data/chroma_db")

chroma_collection = chroma_client.get_or_create_collection(
    name="element_metadata",
    embedding_function=embedding_function
)

router = APIRouter()

@router.post("/upload-image")
async def upload_image(
    images: List[UploadFile] = File(...),
    orders: List[int] = Form(...)
):
    try:
        # Combine images and orders into a sorted list of tuples
        image_order_pairs = list(zip(orders, images))
        image_order_pairs.sort(key=lambda x: x[0])  # sort by order

        results = []

        for order, file in image_order_pairs:
            filename = file.filename.lower()

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
                                        page_name = normalize_page_name(image_name)
                                        print(f"page_name : {page_name}")
                                        process_results = await process_image(
                                            img.copy(), filename=image_name, base_folder=extract_dir
                                        )
                                        for entry in process_results:
                                            metadata = build_standard_metadata(entry, page_name, image_path=image_path)
                                            chroma_collection.add(
                                                ids=[metadata["id"]],
                                                documents=[metadata["text"]],
                                                metadatas=[metadata]
                                            )
                                            results.append(metadata)
                                except Exception as img_err:
                                    print(f"⚠️ Skipping {image_name}: {img_err}")

            elif filename.endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp")):
                with Image.open(file.file) as img:
                    page_name = normalize_page_name(file.filename)
                    process_results = await process_image(img.copy(), filename=file.filename)

                    for entry in process_results:
                        metadata = build_standard_metadata(entry, page_name, image_path=file.filename)
                        chroma_collection.add(
                            ids=[metadata["id"]],
                            documents=[metadata["text"]],
                            metadatas=[metadata]
                        )
                        results.append(metadata)
            else:
                print(f"⚠️ Unsupported format: {filename}")
                raise HTTPException(status_code=400, detail="Unsupported file format. Upload image or ZIP of images.")

        return JSONResponse(content={"status": "success", "data": results})

    except Exception as e:
        print("❌ Error in upload_image:", e)
        raise HTTPException(status_code=500, detail=str(e))
