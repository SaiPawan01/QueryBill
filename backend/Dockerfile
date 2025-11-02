FROM python:3.11-slim

# metadata / build args
ARG PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app \
    PATH=/home/appuser/.local/bin:$PATH

WORKDIR ${APP_HOME}

# Install system deps required by PDF/OCR/DB libs (adjust if you need more/less)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc git curl \
    libpq-dev \
    poppler-utils \
    tesseract-ocr \
    libjpeg-dev zlib1g-dev \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 \
 && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && mkdir -p ${APP_HOME}/uploads && chown -R appuser:appuser ${APP_HOME}

# Copy only requirements first for better layer caching
COPY requirements.txt ${APP_HOME}/requirements.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r ${APP_HOME}/requirements.txt

# Copy application code
COPY --chown=appuser:appuser . ${APP_HOME}

USER appuser
WORKDIR ${APP_HOME}

EXPOSE 8000

# Default command: run uvicorn. Override in docker-compose/systemd if you prefer gunicorn.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]