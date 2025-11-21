# Use Python 3.11 slim image
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directories
RUN mkdir -p /app/data /app/qdrant_data

# 🔹 Run RAG initialization at build time
RUN python rag_system.py

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# 🔹 Only start the web app at runtime
CMD ["python", "app.py"]
