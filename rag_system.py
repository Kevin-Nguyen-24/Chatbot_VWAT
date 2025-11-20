"""
Advanced RAG System for VWAT Chatbot
Implements chunking, embedding, vector storage with Qdrant, and retrieval
"""

import json
import os
from typing import List, Dict, Any, Tuple
import tiktoken
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models
import requests
import numpy as np
from portalocker import exceptions as portalocker_exceptions


class DocumentProcessor:
    """Process and chunk documents for RAG"""
    
    def __init__(self, max_chunk_tokens=512):
        self.max_chunk_tokens = max_chunk_tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.tokenizer.encode(text))
    
    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
        """Chunk text into smaller pieces with metadata"""
        chunks = []
        sentences = text.split('. ')
        
        current_chunk = ""
        current_tokens = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Add period back if it was removed
            if not sentence.endswith('.'):
                sentence += '.'
            
            sentence_tokens = self.count_tokens(sentence)
            
            # If single sentence exceeds max tokens, split it
            if sentence_tokens > self.max_chunk_tokens:
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'tokens': current_tokens,
                        'metadata': metadata or {}
                    })
                    current_chunk = ""
                    current_tokens = 0
                
                # Split long sentence by words
                words = sentence.split()
                temp_chunk = ""
                for word in words:
                    test_chunk = temp_chunk + " " + word if temp_chunk else word
                    if self.count_tokens(test_chunk) > self.max_chunk_tokens:
                        if temp_chunk:
                            chunks.append({
                                'text': temp_chunk.strip(),
                                'tokens': self.count_tokens(temp_chunk),
                                'metadata': metadata or {}
                            })
                        temp_chunk = word
                    else:
                        temp_chunk = test_chunk
                
                if temp_chunk:
                    current_chunk = temp_chunk
                    current_tokens = self.count_tokens(temp_chunk)
            
            # Normal case: add sentence to current chunk
            elif current_tokens + sentence_tokens <= self.max_chunk_tokens:
                current_chunk = current_chunk + " " + sentence if current_chunk else sentence
                current_tokens += sentence_tokens
            else:
                # Save current chunk and start new one
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'tokens': current_tokens,
                        'metadata': metadata or {}
                    })
                current_chunk = sentence
                current_tokens = sentence_tokens
        
        # Add last chunk
        if current_chunk:
            chunks.append({
                'text': current_chunk.strip(),
                'tokens': current_tokens,
                'metadata': metadata or {}
            })
        
        return chunks
    
    def process_json_file(self, filepath: str) -> List[Dict]:
        """Process a JSON file and return chunks with metadata"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        chunks = []
        filename = os.path.basename(filepath)
        
        # Handle different JSON structures
        if filename == 'vwat_complete_rag_data.json':
            # Handle the comprehensive RAG-optimized data
            for item in data:
                if isinstance(item, dict):
                    title = item.get('title', '')
                    content = item.get('content', '')
                    category = item.get('category', '')
                    keywords = item.get('keywords', [])
                    
                    text = f"{title}\n\n{content}"
                    if keywords:
                        text += f"\n\nKeywords: {', '.join(keywords)}"
                    
                    metadata = {
                        'source': filename,
                        'type': 'rag_optimized',
                        'category': category,
                        'id': item.get('id', ''),
                        'keywords': keywords
                    }
                    chunks.extend(self.chunk_text(text, metadata))
        
        elif filename == 'faqs.json' or filename == 'faq_converted.json':
            for item in data:
                if isinstance(item, dict):
                    q = item.get('q', item.get('Unnamed: 0', ''))
                    a = item.get('a', item.get('Unnamed: 1', ''))
                    text = f"Question: {q}\nAnswer: {a}"
                    metadata = {
                        'source': filename,
                        'type': 'faq',
                        'question': q,
                        'answer': a
                    }
                    chunks.extend(self.chunk_text(text, metadata))
        
        elif filename == 'services.json':
            for service in data:
                if isinstance(service, dict):
                    category = service.get('category', '')
                    short = service.get('short', '')
                    offers = service.get('offers', [])
                    
                    text = f"Service Category: {category}\nDescription: {short}\n"
                    if offers:
                        text += "Offerings:\n" + "\n".join([f"• {offer}" for offer in offers])
                    
                    metadata = {
                        'source': filename,
                        'type': 'service',
                        'category': category
                    }
                    chunks.extend(self.chunk_text(text, metadata))
        
        elif filename == 'programs.json' or filename == 'programs_vietnamese.json':
            for program in data:
                if isinstance(program, dict):
                    name = program.get('name', '')
                    category = program.get('category', '')
                    desc = program.get('description', '')
                    
                    # Clean HTML from description
                    import re
                    desc_clean = re.sub('<[^<]+?>', '', desc)
                    
                    text = f"Program: {name}\nCategory: {category}\nDescription: {desc_clean}"
                    metadata = {
                        'source': filename,
                        'type': 'program',
                        'name': name,
                        'category': category
                    }
                    chunks.extend(self.chunk_text(text, metadata))
        
        elif filename == 'org.json':
            if isinstance(data, dict):
                text = f"Organization: {data.get('name', '')}\n"
                text += f"Mission: {data.get('mission', '')}\n"
                
                address = data.get('address', {})
                if address:
                    text += f"Address: {address.get('street', '')}, {address.get('city', '')}, {address.get('province', '')} {address.get('postal_code', '')}\n"
                
                hours = data.get('hours', {})
                if hours:
                    text += f"Hours: {hours.get('monday_friday', '')}\n"
                
                emails = data.get('emails', {})
                if emails:
                    text += f"Emails: {', '.join([f'{k}: {v}' for k, v in emails.items()])}\n"
                
                metadata = {
                    'source': filename,
                    'type': 'organization'
                }
                chunks.extend(self.chunk_text(text, metadata))
        
        elif 'converted' in filename:
            # Handle converted Excel files
            for item in data:
                if isinstance(item, dict):
                    text = " ".join([str(v) for v in item.values() if v and str(v) != 'nan'])
                    if text.strip():
                        metadata = {
                            'source': filename,
                            'type': 'converted_data'
                        }
                        chunks.extend(self.chunk_text(text, metadata))
        
        return chunks


class RAGSystem:
    """Complete RAG system with Qdrant vector database"""
    
    _instance = None
    _lock_file = None
    
    def __init__(self, 
                 embedding_model_name='paraphrase-multilingual-MiniLM-L12-v2',
                 qdrant_path='./qdrant_data',
                 collection_name='vwat_knowledge'):
        
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        self.qdrant_path = qdrant_path
        
        # Initialize Qdrant client with retry logic for Windows file locking
        import time
        max_retries = 5
        retry_delay = 3
        
        for attempt in range(max_retries):
            try:
                # Try to clean up stale lock files first
                if attempt > 0:
                    self._cleanup_stale_locks(qdrant_path)
                
                self.client = QdrantClient(path=qdrant_path)
                print(f"Successfully connected to Qdrant at {qdrant_path}")
                break
            except (RuntimeError, portalocker_exceptions.AlreadyLocked) as e:
                if attempt < max_retries - 1:
                    print(f"Qdrant locked, waiting {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                    print(f"Tip: Close any other Python processes accessing {qdrant_path}")
                    time.sleep(retry_delay)
                else:
                    raise RuntimeError(
                        f"Cannot access Qdrant storage at {qdrant_path}. \n"
                        "Please ensure no other instances are running.\n"
                        "Try the following:\n"
                        "1. Close any other Python processes with Task Manager\n"
                        f"2. Delete the lock file at: {qdrant_path}/.lock\n"
                        "3. Restart your application"
                    ) from e
        
        self.collection_name = collection_name
        self.processor = DocumentProcessor()
        
        # Initialize collection
        self._init_collection()
    
    def _cleanup_stale_locks(self, qdrant_path):
        """Try to clean up stale lock files if they exist"""
        import psutil
        lock_file = os.path.join(qdrant_path, '.lock')
        
        if os.path.exists(lock_file):
            try:
                # Check if any Python process is actually using the Qdrant path
                qdrant_in_use = False
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    try:
                        if proc.info['name'] and 'python' in proc.info['name'].lower():
                            cmdline = proc.info.get('cmdline', [])
                            if cmdline and any(qdrant_path in str(arg) for arg in cmdline):
                                # Check if process is actually alive and responsive
                                if proc.is_running() and proc.status() != psutil.STATUS_ZOMBIE:
                                    qdrant_in_use = True
                                    break
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                
                # If no active process is using it, try to remove the lock
                if not qdrant_in_use:
                    print(f"Attempting to remove stale lock file: {lock_file}")
                    try:
                        os.remove(lock_file)
                        print("Stale lock file removed successfully")
                    except PermissionError:
                        print("Lock file is still in use by another process")
            except Exception as e:
                print(f"Warning: Could not check for stale locks: {e}")
    
    def _init_collection(self):
        """Initialize Qdrant collection"""
        try:
            self.client.get_collection(self.collection_name)
            print(f"Collection '{self.collection_name}' already exists")
        except:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dim,
                    distance=models.Distance.COSINE
                )
            )
            print(f"Created collection '{self.collection_name}'")
    
    def close(self):
        """Properly close the Qdrant client and release locks"""
        if hasattr(self, 'client') and self.client:
            try:
                self.client.close()
                print("Qdrant client closed successfully")
            except Exception as e:
                print(f"Error closing Qdrant client: {e}")
    
    def __del__(self):
        """Ensure cleanup on deletion"""
        self.close()
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts"""
        embeddings = self.embedding_model.encode(texts, show_progress_bar=True)
        return embeddings
    
    def index_documents(self, data_dir='./data'):
        """Index all documents from data directory"""
        json_files = [
            'faqs.json',
            'org.json',
            'contacts.json',
            'vwat_complete_rag_data.json'

        ]
        
        all_chunks = []
        
        for filename in json_files:
            filepath = os.path.join(data_dir, filename)
            if os.path.exists(filepath):
                print(f"Processing {filename}...")
                chunks = self.processor.process_json_file(filepath)
                all_chunks.extend(chunks)
                print(f"  Generated {len(chunks)} chunks")
        
        if not all_chunks:
            print("No chunks to index!")
            return
        
        print(f"\nTotal chunks to index: {len(all_chunks)}")
        
        # Generate embeddings
        texts = [chunk['text'] for chunk in all_chunks]
        print("Generating embeddings...")
        embeddings = self.embed_texts(texts)
        
        # Prepare points for Qdrant
        points = []
        for idx, (chunk, embedding) in enumerate(zip(all_chunks, embeddings)):
            point = models.PointStruct(
                id=idx,
                vector=embedding.tolist(),
                payload={
                    'text': chunk['text'],
                    'tokens': chunk['tokens'],
                    **chunk['metadata']
                }
            )
            points.append(point)
        
        # Upload to Qdrant in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i+batch_size]
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch
            )
            print(f"Indexed {min(i+batch_size, len(points))}/{len(points)} chunks")
        
        print(f"\n✅ Successfully indexed {len(points)} chunks!")
    
    def retrieve(self, query: str, top_k=5) -> List[Dict]:
        """Retrieve relevant documents for query"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode(query)
        
        # Search in Qdrant
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding.tolist(),
            limit=top_k
        )
        
        # Format results
        retrieved_docs = []
        for result in results:
            retrieved_docs.append({
                'text': result.payload['text'],
                'score': result.score,
                'source': result.payload.get('source', 'unknown'),
                'type': result.payload.get('type', 'unknown'),
                'metadata': result.payload
            })
        
        return retrieved_docs
    
    def generate_context(self, retrieved_docs: List[Dict]) -> str:
        """Generate context string from retrieved documents"""
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            context_parts.append(f"[Document {i}] (Source: {doc['source']}, Score: {doc['score']:.3f})\n{doc['text']}\n")
        
        return "\n".join(context_parts)


class LLMClient:
    """Client for Ollama/Gemma LLM API"""
    
    def __init__(self, api_url='https://ollama-gemma-683508575972.us-central1.run.app'):
        self.api_url = api_url.rstrip('/')
    
    def generate(self, prompt: str, max_tokens=512, temperature=0.7, stream=False) -> str:
        """Generate response from LLM"""
        # Try multiple endpoint variations
        endpoints = [
            f"{self.api_url}/api/generate",
            f"{self.api_url}/generate",
            f"{self.api_url}/v1/completions",
            f"{self.api_url}/api/chat"
        ]
        
        for endpoint in endpoints:
            try:
                # Try Ollama format
                response = requests.post(
                    endpoint,
                    json={
                        "model": "gemma3:4b",
                        "prompt": prompt,
                        "stream": stream,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens
                        }
                    },
                    timeout=30,
                    stream=stream
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get('response', result.get('text', result.get('content', '')))
                elif response.status_code == 404:
                    continue  # Try next endpoint
                elif response.status_code == 429 or response.status_code == 503:
                    # Rate limit or quota exceeded - return error to trigger fallback
                    print(f"Quota limit exceeded (status {response.status_code})")
                    return "QuotaLimit: API quota exceeded"
                else:
                    print(f"API returned status {response.status_code} for {endpoint}")
                    continue
            
            except Exception as e:
                print(f"Error with endpoint {endpoint}: {str(e)}")
                continue
        
        # If all endpoints fail, return a helpful fallback message
        return "I apologize, but I'm having trouble connecting to the AI service. However, based on the information I found, I can help you with your question. Please contact us directly at info@vwat.org or +1-647-343-8928 for immediate assistance."


def create_rag_prompt(query: str, context: str, language: str = 'vi') -> str:
    """Create RAG prompt for LLM with language support"""
    
    if language == 'vi':
        prompt = f"""Bạn là trợ lý hữu ích cho Dịch vụ Gia đình VWAT, một tổ chức phi lợi nhuận giúp đỡ người tị nạn và người nhập cư ở Toronto.

Sử dụng CHÍNH XÁC thông tin từ ngữ cảnh dưới đây để trả lời câu hỏi. KHÔNG được tự bị thông tin.

HƯỚNG DẪN QUAN TRỌNG:
- CHỈ sử dụng thông tin từ ngữ cảnh - KHÔNG được tạo ra số điện thoại, email, địa chỉ hoặc thông tin liên hệ khác
- Nếu có số điện thoại trong ngữ cảnh, sao chép CHÍNH XÁC số đó
- Trả lời trực tiếp câu hỏi - KHÔNG được lặp lại hoặc diễn giải lại câu hỏi
- Sử dụng dấu đầu dòng (•) khi liệt kê nhiều mục
- Giữ đoạn văn ngắn và dễ đọc
- Bắt đầu ngay bằng câu trả lời
- **QUAN TRỌNG**: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT - Nếu thông tin trong ngữ cảnh là tiếng Anh, hãy DỊCH sang tiếng Việt
- **BẮT BUỘC**: Tất cả các mục liệt kê phải bằng tiếng Việt, KHÔNG được để tiếng Anh
- KHÔNG được bao gồm bất kỳ mã HTML, thẻ hoặc thuộc tính (như href=, target=, v.v.) trong câu trả lời
- Khi đề cập đến trang web, chỉ viết dưới dạng văn bản thuần túy (ví dụ: "Website: www.vwat.org" không phải "Website: href='www.vwat.org'")

NGỮ CẢNH:
{context}

CÂU HỎI: {query}

CÂU TRẢ LỜI (chỉ dùng thông tin từ ngữ cảnh, DỊCH tất cả sang tiếng Việt):"""
    else:  # English
        prompt = f"""You are a helpful assistant for VWAT Family Services, a non-profit organization helping refugees and immigrants in Toronto.

Use ONLY the information from the context below to answer the question. DO NOT make up information.

IMPORTANT INSTRUCTIONS:
- ONLY use information from the context - DO NOT fabricate phone numbers, emails, addresses or other contact info
- If there are phone numbers in the context, copy them EXACTLY
- Answer the question directly - DO NOT repeat or rephrase the question
- Use bullet points (•) when listing multiple items, services, or options
- Keep paragraphs short and easy to read
- Start with the answer immediately
- ANSWER IN ENGLISH
- DO NOT include any HTML code, tags, or attributes (like href=, target=, etc.) in your response
- When mentioning websites, write them as plain text only (e.g., "Website: www.vwat.org" not "Website: href='www.vwat.org'")

CONTEXT:
{context}

QUESTION: {query}

ANSWER (use only context information, answer in English):"""
    
    return prompt


def is_query_relevant(query: str, language: str = 'vi') -> bool:
    """Check if query is related to VWAT services, programs, or organization"""
    query_lower = query.lower()
    
    # Keywords related to VWAT services and topics
    vwat_keywords = [
        # English keywords
        'vwat', 'vietnamese', 'refugee', 'immigrant', 'immigration', 'newcomer',
        'settlement', 'service', 'program', 'help', 'assist', 'support',
        'appointment', 'contact', 'address', 'location', 'hours', 'email', 'phone',
        'employment', 'job', 'work', 'language', 'english', 'esl', 'linc',
        'housing', 'rent', 'accommodation', 'legal', 'tax', 'health', 'medical',
        'family', 'youth', 'senior', 'children', 'education', 'school',
        'citizenship', 'pr card', 'visa', 'document', 'translation',
        'counseling', 'mental health', 'workshop', 'class', 'training',
        'toronto', 'organization', 'non-profit', 'volunteer', 'donate',
        # Vietnamese keywords
        'dịch vụ', 'chương trình', 'hỗ trợ', 'giúp đỡ', 'người nhập cư', 'tị nạn',
        'định cư', 'liên hệ', 'địa chỉ', 'giờ làm việc', 'điện thoại',
        'việc làm', 'công việc', 'tiếng anh', 'nhà ở', 'thuê nhà', 'pháp lý',
        'thuế', 'sức khỏe', 'y tế', 'gia đình', 'thanh thiếu niên', 'người cao tuổi',
        'trẻ em', 'giáo dục', 'trường học', 'quốc tịch', 'tư vấn', 'lớp học',
        'đào tạo', 'tổ chức', 'tình nguyện', 'quyên góp', 'hẹn gặp'
    ]
    
    # Off-topic keywords that indicate irrelevant queries
    off_topic_keywords = [
        'weather', 'thời tiết', 'nấu ăn', 'cooking', 'recipe', 'công thức', 'cook', 'pasta', 'food',
        'sport', 'thể thao', 'movie', 'phim', 'music', 'nhạc', 'football', 'soccer', 'basketball',
        'game', 'trò chơi', 'shopping', 'mua sắm', 'fashion', 'thời trang',
        'restaurant', 'nhà hàng', 'travel', 'du lịch', 'vacation', 'nghỉ mát',
        # Financial/currency queries
        'usd', 'cad', 'currency', 'exchange rate', 'tỷ giá', 'dollar', 'euro',
        'stock', 'cổ phiếu', 'crypto', 'bitcoin', 'forex', 'trading'
    ]
    
    # Check for off-topic keywords first
    for keyword in off_topic_keywords:
        if keyword in query_lower:
            return False
    
    # Check for VWAT-related keywords
    for keyword in vwat_keywords:
        if keyword in query_lower:
            return True
    
    # If no clear match, retrieve documents and check relevance score
    # This is more lenient for ambiguous queries
    return True  # Let RAG system handle it if unclear


# Main functions for Flask integration
rag_system = None
llm_client = None

def initialize_rag():
    """Initialize RAG system (call this once at app startup)"""
    global rag_system, llm_client
    if rag_system is None:
        rag_system = RAGSystem()
        llm_client = LLMClient()
    return rag_system

def cleanup_rag():
    """Cleanup RAG system resources"""
    global rag_system, llm_client
    if rag_system is not None:
        rag_system.close()
        rag_system = None
    llm_client = None

def clean_html_artifacts(text: str) -> str:
    """Remove malformed HTML tags and attributes from LLM responses"""
    import re
    
    # AGGRESSIVE: Remove the exact pattern we're seeing: Website: href="..." target="...">URL
    text = re.sub(r'Website:\s*href\s*=\s*["\'][^"\'>]*["\']\s*target\s*=\s*["\'][^"\'>]*["\']\s*>\s*(www\.[^\s<]+|https?://[^\s<]+)', 
                  r'Website: \1', text, flags=re.IGNORECASE)
    
    # Remove href attributes that appear as text (various formats)
    text = re.sub(r'\s*href\s*=\s*["\'][^"\'>]*["\']', '', text, flags=re.IGNORECASE)
    
    # Remove target attributes
    text = re.sub(r'\s*target\s*=\s*["\'][^"\'>]*["\']', '', text, flags=re.IGNORECASE)
    
    # Remove any remaining HTML-like attributes (rel, class, etc.)
    text = re.sub(r'\s+\w+\s*=\s*["\'][^"\'>]*["\']', '', text)
    
    # Remove standalone opening/closing angle brackets followed by URLs
    text = re.sub(r'>\s*(https?://[^\s<]+|www\.[^\s<]+)', r'\1', text)
    text = re.sub(r'<\s*(https?://[^\s>]+|www\.[^\s>]+)', r'\1', text)
    
    # Remove standalone angle brackets that aren't part of valid HTML
    text = re.sub(r'(?<!<br)>(?![^<]*</)', '', text)
    
    # Clean up "Website:" prefix that may have gotten mangled  
    text = re.sub(r'Website:\s{2,}', 'Website: ', text)
    
    # Remove any leftover HTML tags except <br>
    text = re.sub(r'<(?!br\s*/?)[^>]+>', '', text)
    
    return text.strip()

def get_rag_response(query: str, language: str = 'vi') -> Dict[str, Any]:
    """Get response using RAG system with language support - LLM-driven responses only"""
    global rag_system, llm_client
    
    if rag_system is None:
        initialize_rag()
    
    # Check if query is off-topic
    if not is_query_relevant(query, language):
        if language == 'vi':
            off_topic_response = "Xin lỗi, câu hỏi này nằm ngoài phạm vi hỗ trợ của tôi. Tôi được thiết kế để hỗ trợ về các dịch vụ và chương trình của VWAT Family Services.<br><br>Vui lòng hỏi về:<br>• Dịch vụ định cư cho người mới đến Canada<br>• Hỗ trợ việc làm và đào tạo<br>• Lớp học tiếng Anh<br>• Dịch vụ cho người cao tuổi và thanh thiếu niên<br>• Thông tin liên hệ và đặt lịch hẹn"
        else:
            off_topic_response = "I apologize, but this question is outside my area of support. I'm designed to help with VWAT Family Services programs and services.<br><br>Please ask about:<br>• Settlement services for newcomers to Canada<br>• Employment and training support<br>• English language classes<br>• Services for seniors and youth<br>• Contact information and appointments"
        return {
            'response': off_topic_response,
            'retrieved_docs': [],
            'context': ''
        }
    
    # Retrieve relevant documents - let LLM decide relevance
    retrieved_docs = rag_system.retrieve(query, top_k=5)
    
    # Generate context from retrieved documents
    context = rag_system.generate_context(retrieved_docs)
    
    # Create prompt with language parameter
    prompt = create_rag_prompt(query, context, language)
    
    # Generate response using LLM
    try:
        response = llm_client.generate(prompt)
        
        # Clean up any HTML artifacts from the response
        if response and "Error" not in response:
            # FIRST: Clean HTML artifacts BEFORE doing anything else
            response = clean_html_artifacts(response)
            # SECOND: Convert newlines to HTML breaks for proper display
            response = response.replace('\n', '<br>')
            # THIRD: Clean again in case any HTML slipped through
            response = clean_html_artifacts(response)
        else:
            # If LLM returns an error, provide graceful fallback
            error_msg = "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại hoặc liên hệ info@vwat.org / +1-647-343-8928." if language == 'vi' else "I apologize, I encountered an issue processing your question. Please try again or contact info@vwat.org / +1-647-343-8928."
            response = error_msg
    
    except Exception as e:
        print(f"LLM generation failed: {str(e)}")
        error_msg = "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại hoặc liên hệ info@vwat.org / +1-647-343-8928." if language == 'vi' else "I apologize, I encountered an issue processing your question. Please try again or contact info@vwat.org / +1-647-343-8928."
        response = error_msg
    
    return {
        'response': response,
        'retrieved_docs': retrieved_docs,
        'context': context
    }


if __name__ == "__main__":
    # Initialize and index documents
    print("Initializing RAG system...")
    rag = RAGSystem()
    
    print("\nIndexing documents...")
    rag.index_documents()
    
    print("\n✅ RAG system initialized and documents indexed!")
    print("\nTesting retrieval...")
    test_query = "How do I book an appointment?"
    results = rag.retrieve(test_query, top_k=3)
    
    print(f"\nQuery: {test_query}")
    print(f"Retrieved {len(results)} documents:")
    for i, doc in enumerate(results, 1):
        print(f"\n{i}. Score: {doc['score']:.3f} | Source: {doc['source']}")
        print(f"   {doc['text'][:200]}...")
