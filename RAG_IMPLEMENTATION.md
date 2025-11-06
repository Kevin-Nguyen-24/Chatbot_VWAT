# Advanced RAG Implementation for VWAT Chatbot

## Overview

The VWAT chatbot now features a **hybrid architecture** combining:
1. **Rule-based responses** - Button-click interactions for structured navigation
2. **RAG-based responses** - AI-powered answers for typed questions using Retrieval-Augmented Generation

## Architecture

### Components

1. **Document Processor** (`rag_system.py`)
   - Processes JSON and Excel data files
   - Chunks text using token-based splitting (max 512 tokens per chunk)
   - Preserves metadata for context tracking

2. **Embedding System**
   - Model: `all-MiniLM-L6-v2` (sentence-transformers)
   - Dimension: 384
   - Fast and efficient for semantic search

3. **Vector Database**
   - **Qdrant** (local mode)
   - Stores 95 document chunks with embeddings
   - Cosine similarity for retrieval

4. **LLM Integration**
   - Endpoint: `https://ollama-gemma-324573599995.us-central1.run.app/`
   - Model: Gemma
   - Generates contextual responses based on retrieved documents

## Data Sources

The RAG system indexes the following data:
- `faqs.json` - 22 chunks (Frequently asked questions)
- `services.json` - 4 chunks (Service categories)
- `programs.json` - 13 chunks (Program details)
- `org.json` - 1 chunk (Organization information)
- `faq_converted.json` - 16 chunks (Converted FAQ data)
- `VWAT_organise_converted.json` - 8 chunks (Organization structure)
- `vwat_services_master_rag_converted.json` - 31 chunks (Master services data)

**Total: 95 document chunks indexed**

## How It Works

### 1. User Types a Question
```
User: "How do I book an appointment?"
```

### 2. Query Processing
- User message sent to `/chat` endpoint
- Query embedded using sentence-transformers

### 3. Retrieval
- Top 5 most relevant chunks retrieved from Qdrant
- Scored by cosine similarity

### 4. Context Generation
- Retrieved documents formatted with sources and scores
- Context provided to LLM

### 5. Response Generation
- LLM generates natural language response
- Response includes VWAT-specific context
- Sources tracked for transparency

### 6. Display
- Response shown to user
- Sources logged in console for debugging

## Key Features

✅ **Token-based Chunking** - Ensures chunks fit within model limits
✅ **Metadata Tracking** - Every chunk knows its source and type
✅ **Semantic Search** - Finds relevant information even with varied phrasing
✅ **Context-Aware** - LLM has access to organization-specific knowledge
✅ **Hybrid System** - Rule-based + AI-powered for best user experience
✅ **Source Attribution** - Tracks which documents informed each response

## Files Created

1. **`rag_system.py`** - Complete RAG implementation
   - DocumentProcessor class
   - RAGSystem class
   - LLMClient class
   - Integration functions

2. **`convert_excel_to_json.py`** - Utility to convert Excel files

3. **`requirements_rag.txt`** - Python dependencies

4. **`qdrant_data/`** - Local vector database storage

## API Endpoints

### POST `/chat`
Handles both rule-based and RAG-based queries.

**Request:**
```json
{
  "message": "How do I book an appointment?"
}
```

**Response:**
```json
{
  "response": "You can book an appointment by using our online portal at https://www.vwat.org/appointments/ or by calling +1-647-343-8928.",
  "status": "success",
  "sources": [
    {
      "source": "faqs.json",
      "score": 0.759
    }
  ]
}
```

## Running the System

### First Time Setup

1. **Install dependencies:**
```bash
pip install -r requirements_rag.txt
```

2. **Index documents (one-time):**
```bash
python rag_system.py
```

This will:
- Initialize Qdrant
- Process all data files
- Generate embeddings
- Index 95 chunks

### Starting the Chatbot

```bash
python app.py
```

The RAG system initializes automatically on startup.

## Configuration

### Adjusting Chunk Size
In `rag_system.py`:
```python
processor = DocumentProcessor(max_chunk_tokens=512)  # Adjust as needed
```

### Changing Embedding Model
```python
rag = RAGSystem(embedding_model_name='all-MiniLM-L6-v2')  # Try other models
```

### Retrieval Parameters
```python
retrieved_docs = rag_system.retrieve(query, top_k=5)  # Adjust number of results
```

### LLM Parameters
```python
response = llm_client.generate(
    prompt,
    max_tokens=512,      # Response length
    temperature=0.7      # Creativity (0=deterministic, 1=creative)
)
```

## Performance

- **Indexing Time:** ~10 seconds for 95 chunks
- **Query Time:** ~1-2 seconds per question
- **Storage:** ~50MB for vector database
- **Memory:** ~500MB during operation

## Future Enhancements

- [ ] Add conversation history tracking
- [ ] Implement query rewriting for better retrieval
- [ ] Add re-ranking with cross-encoder
- [ ] Support for multiple languages
- [ ] Analytics dashboard for query patterns
- [ ] A/B testing between different retrieval strategies

## Troubleshooting

### "Collection already exists" error
This is normal - the system reuses existing collections.

### Slow first query
First query downloads the embedding model (~90MB). Subsequent queries are fast.

### LLM timeout
Check API endpoint connectivity. Increase timeout in `rag_system.py`:
```python
response = requests.post(..., timeout=60)  # Increase from 30
```

### Poor retrieval quality
Try:
1. Increasing `top_k` parameter
2. Adjusting chunk size
3. Using a larger embedding model

## Credits

- **Framework:** Flask
- **Embeddings:** sentence-transformers (all-MiniLM-L6-v2)
- **Vector DB:** Qdrant
- **LLM:** Gemma (via Ollama API)
- **Tokenization:** tiktoken (OpenAI)

## Support

For issues or questions about the RAG implementation:
- Check console logs for detailed error messages
- Verify all dependencies are installed
- Ensure `qdrant_data/` directory has write permissions
- Test the LLM API endpoint separately
