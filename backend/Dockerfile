# -------- Stage 1: Builder -------- #
FROM python:3.12.3-slim-bookworm AS builder

WORKDIR /app

# Install system dependencies needed to build packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libffi-dev \
    tesseract-ocr curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python deps into /python_deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --target=/python_deps -r requirements.txt

# cache huggingface/sentence-transformer models
# You can uncomment the below to preload a specific model
# RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# -------- Stage 2: Production -------- #
FROM python:3.12.3-slim-bookworm

WORKDIR /app

# Runtime system deps only
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender1 tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /python_deps /usr/local/lib/python3.12/site-packages

# Copy your application
COPY . .
# COPY models ./models

# Expose backend port
EXPOSE 8001

# Run FastAPI app (adjust if using Uvicorn/Gunicorn)
CMD ["python", "main.py"]