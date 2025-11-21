# VWAT Family Services Chatbot

A bilingual (Vietnamese/English) chatbot for VWAT Family Services that combines rule-based responses with an advanced RAG (Retrieval-Augmented Generation) system powered by Qdrant vector database and Gemma LLM.

## Features

- 🌐 **Bilingual Support**: Vietnamese (default) and English
- 🤖 **Hybrid System**: Rule-based button responses + AI-powered RAG for typed questions
- 🔍 **Advanced RAG**: Token-based chunking, semantic search with Qdrant vector database
- 💬 **Streaming Responses**: Word-by-word display for natural conversation flow
- 📱 **Responsive UI**: Clean, modern interface with language switching
- 📊 **Knowledge Base**: Indexes FAQs, services, programs, and organizational information

## Architecture

### Components

1. **Frontend** (`templates/chatbot.html`, `static/chatbot.js`)
   - Interactive chat interface with button and text input
   - Language selector (🇻🇳 Tiếng Việt / 🇬🇧 English)
   - Streaming message display

2. **Translation System** (`static/languages.js`)
   - Complete Vietnamese and English translations
   - Persistent language preference in localStorage

3. **Backend** (`app.py`)
   - Flask web server
   - RESTful API endpoints
   - RAG system integration

4. **RAG System** (`rag_system.py`)
   - Document processing and chunking (512 tokens max)
   - Sentence-transformers embeddings (all-MiniLM-L6-v2, 384 dimensions)
   - Qdrant local vector database
   - LLM integration with hosted Gemma API
   - Bilingual prompt generation

5. **Data** (`data/` folder)
   - `faqs.json` - Frequently asked questions
   - `services.json` - Service descriptions
   - `programs.json` - Program information
   - `org.json` - Organization details
   - `contacts.json` - Contact information
   - `*_converted.json` - Converted Excel data

## Requirements

- Python 3.8+
- Flask
- Qdrant Client
- Sentence Transformers
- tiktoken
- numpy
- requests

## Installation

### 1. Clone or Download the Project

```bash
cd C:\Data\AIG\Project\RAG\chatbot_VWAT
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Required packages:**
```
flask
qdrant-client
sentence-transformers
tiktoken
numpy
requests
```

### 3. Initialize the RAG System

First time setup - this will index all documents:

```bash
python rag_system.py
```

This will:
- Create `qdrant_data/` folder
- Process all JSON files in `data/` folder
- Generate embeddings for ~95 document chunks
- Store vectors in local Qdrant database

**Expected output:**
```
Initializing RAG system...
Created collection 'vwat_knowledge'

Indexing documents...
Processing faqs.json...
  Generated 22 chunks
Processing services.json...
  Generated 4 chunks
...

Total chunks to index: 95
Generating embeddings...
Indexed 95/95 chunks

✅ Successfully indexed 95 chunks!
```

## Running the Application

### Start the Flask Server

```bash
python app.py
```

**Expected output:**
```
Initializing RAG system...
Collection 'vwat_knowledge' already exists
RAG system initialized!
 * Running on http://localhost:8000
```

### Access the Chatbot

Open your web browser and navigate to:
```
http://localhost:8000
```

## Usage Guide

### Rule-Based Responses (Button Clicks)

1. **Main Menu**: Services, Programs, Appointment, Contact Information
2. **Services Submenu**: Newcomer, Employment, Senior, Youth services
3. **Programs**: Dynamic list from `programs.json` (filtered by `expired=no` and `news=yes`)
4. **Appointment**: Direct booking button to VWAT website
5. **Contact**: Complete contact information with address, phone, email, hours

### RAG-Powered Responses (Typed Questions)

Users can type questions in natural language (Vietnamese or English):
- "What services do you offer?"
- "How do I book an appointment?"
- "Tell me about the free tax clinic"
- "Các dịch vụ cho người cao tuổi?"

The system will:
1. Detect intent and route to rule-based response if applicable
2. Otherwise, use RAG system to:
   - Search vector database for relevant information
   - Generate contextual response using Gemma LLM
   - Display answer with streaming effect

### Language Switching

Click the language buttons at the top:
- 🇻🇳 **Tiếng Việt** - Switch to Vietnamese
- 🇬🇧 **English** - Switch to English

Language preference is saved and persists across sessions.

## Updating Data and Reindexing

### When to Reindex

You need to reindex the RAG system when you:
- ✏️ Modify any JSON files in `data/` folder
- ➕ Add new JSON files
- 🗑️ Delete JSON files
- 🔄 Update service descriptions, FAQs, or program information

### Reindexing Steps

#### Option 1: Manual Steps

1. **Stop the Flask app** (if running)
   - Press `Ctrl+C` in the terminal

2. **Delete the old vector database**
   ```bash
   Remove-Item -Recurse -Force qdrant_data
   ```

3. **Reindex the data**
   ```bash
   python rag_system.py
   ```
   
   Wait for completion (you'll see "✅ Successfully indexed X chunks!")

4. **Restart the Flask app**
   ```bash
   python app.py
   ```

#### Option 2: One-Line Command (PowerShell)

```powershell
Remove-Item -Recurse -Force qdrant_data; python rag_system.py; python app.py
```

#### Option 3: Batch Script

Create a file named `reindex.bat`:

```batch
@echo off
echo Stopping any running Flask instances...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *app.py*" 2>nul

echo Deleting old Qdrant database...
if exist qdrant_data rmdir /s /q qdrant_data

echo Reindexing documents...
python rag_system.py

echo Starting Flask app...
python app.py
```

Then run:
```bash
reindex.bat
```

### Indexed Files

The following files are automatically indexed:
- `data/faqs.json`
- `data/services.json`
- `data/programs.json`
- `data/org.json`
- `data/contacts.json`
- `data/faq_converted.json`
- `data/VWAT_organise_converted.json`
- `data/vwat_services_master_rag_converted.json`

**Note**: Only these specific files are indexed, not all files in the `data/` folder.

## Project Structure

```
chatbot_VWAT/
├── app.py                          # Flask application
├── rag_system.py                   # RAG system implementation
├── requirements.txt                # Python dependencies
├── README.md                       # This file
│
├── templates/
│   └── chatbot.html                # Main HTML template
│
├── static/
│   ├── chatbot.js                  # Chat logic and UI interactions
│   ├── chatbot.css                 # Styling
│   └── languages.js                # Translation system
│
├── data/                           # Knowledge base (JSON files)
│   ├── faqs.json
│   ├── services.json
│   ├── programs.json
│   ├── org.json
│   ├── contacts.json
│   └── *_converted.json
│
└── qdrant_data/                    # Vector database (auto-generated)
    └── ... (binary files)
```

## Configuration

### RAG System Parameters

In `rag_system.py`:

- **Max chunk tokens**: 512 (adjustable in `DocumentProcessor`)
- **Embedding model**: `all-MiniLM-L6-v2` (384 dimensions)
- **Retrieval top_k**: 5 documents per query
- **LLM endpoint**: `https://ollama-gemma-324573599995.us-central1.run.app`
- **LLM model**: `gemma3:4b`

### Flask Settings

In `app.py`:

- **Host**: `localhost`
- **Port**: `8000`
- **Debug mode**: `True`
- **Reloader**: `False` (prevents Qdrant locking issues)

## Troubleshooting

### Problem: "Collection 'vwat_knowledge' already exists" but no data

**Solution**: Delete and reindex
```bash
Remove-Item -Recurse -Force qdrant_data
python rag_system.py
```

### Problem: Flask won't start (port already in use)

**Solution**: Kill existing Python processes
```bash
taskkill /F /IM python.exe
```

Or change the port in `app.py`:
```python
app.run(debug=True, host='localhost', port=8001, use_reloader=False)
```

### Problem: Wrong phone numbers in responses

**Cause**: LLM hallucination or outdated indexed data

**Solution**: 
1. Verify phone numbers in JSON files (should be `+1-647-343-8928`)
2. Reindex the database
3. The improved prompts now explicitly prevent hallucination

### Problem: RAG responses not in correct language

**Solution**: 
- Ensure language parameter is being sent from frontend
- Check browser console for errors
- The system now sends `currentLanguage` to backend

### Problem: Qdrant database locked

**Cause**: Flask reloader creating multiple processes

**Solution**: Already fixed - `use_reloader=False` in `app.py`

## API Endpoints

### GET `/`
Returns the main chatbot HTML page.

### POST `/chat`
Handles user messages and returns AI responses.

**Request:**
```json
{
  "message": "What services do you offer?",
  "language": "en"
}
```

**Response:**
```json
{
  "status": "success",
  "response": "We offer the following services...",
  "sources": [
    {"source": "services.json", "score": 0.85},
    {"source": "faqs.json", "score": 0.78}
  ]
}
```

### GET `/data/<filename>`
Serves JSON files from the `data/` folder.

## Development

### Adding New Data

1. Create or update JSON file in `data/` folder
2. Ensure proper format (see existing files as examples)
3. Add filename to `json_files` list in `rag_system.py` (if new file)
4. Reindex the database

### Modifying Translations

Edit `static/languages.js`:

```javascript
const translations = {
    vi: {
        newKey: 'Bản dịch tiếng Việt',
        ...
    },
    en: {
        newKey: 'English translation',
        ...
    }
};
```

Then use in `chatbot.js`:
```javascript
const text = t('newKey');
```

### Customizing RAG Prompts

Edit `create_rag_prompt()` in `rag_system.py` to modify how the LLM generates responses.

## Contact & Support

**VWAT Family Services**
- 📍 Address: 1756 St. Clair Ave West, Toronto ON M6N 1J3
- 📞 Phone: +1-647-343-8928
- 📧 Email: info@vwat.org
- 🌐 Website: www.vwat.org

## License

© 2025 VWAT Family Services. All rights reserved.

## Version History

- **v1.0** (2025-01) - Initial release with bilingual support and RAG integration
