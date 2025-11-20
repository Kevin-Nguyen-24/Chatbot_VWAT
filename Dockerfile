# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements_rag.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements_rag.txt

# Copy application files
COPY . .

# Create data directory if it doesn't exist
RUN mkdir -p /app/data /app/qdrant_data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port (Google Cloud Run uses 8080)
EXPOSE 8080

# Initialize RAG system and start Flask app
CMD python rag_system.py && python app.py
