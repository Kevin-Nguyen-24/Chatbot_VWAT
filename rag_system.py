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
        if filename == 'faqs.json' or filename == 'faq_converted.json':
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
        
        elif filename == 'programs.json':
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
    
    def __init__(self, 
                 embedding_model_name='all-MiniLM-L6-v2',
                 qdrant_path='./qdrant_data',
                 collection_name='vwat_knowledge'):
        
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        
        # Initialize Qdrant client (local mode)
        self.client = QdrantClient(path=qdrant_path)
        self.collection_name = collection_name
        
        self.processor = DocumentProcessor()
        
        # Initialize collection
        self._init_collection()
    
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
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts"""
        embeddings = self.embedding_model.encode(texts, show_progress_bar=True)
        return embeddings
    
    def index_documents(self, data_dir='./data'):
        """Index all documents from data directory"""
        json_files = [
            'faqs.json',
            'services.json',
            'programs.json',
            'org.json',
            'contacts.json',
            'faq_converted.json',
            'VWAT_organise_converted.json',
            'vwat_services_master_rag_converted.json'
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
    
    def __init__(self, api_url='https://ollama-gemma-324573599995.us-central1.run.app'):
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
                else:
                    print(f"API returned status {response.status_code} for {endpoint}")
                    continue
            
            except Exception as e:
                print(f"Error with endpoint {endpoint}: {str(e)}")
                continue
        
        # If all endpoints fail, return a helpful fallback message
        return "I apologize, but I'm having trouble connecting to the AI service. However, based on the information I found, I can help you with your question. Please contact us directly at info@vwat.org or +1-647-343-8928 for immediate assistance."


def create_rag_prompt(query: str, context: str) -> str:
    """Create RAG prompt for LLM"""
    prompt = f"""You are a helpful assistant for VWAT Family Services, a non-profit organization helping refugees and immigrants in Toronto.

Use the following context to answer the user's question. Be concise, helpful, and accurate.

IMPORTANT INSTRUCTIONS:
- Answer the question directly - DO NOT repeat or rephrase the question
- Use bullet points (•) when listing multiple items, services, or options
- Keep paragraphs short and easy to read
- Use line breaks between different sections
- Include contact information when relevant
- Start with the answer immediately

CONTEXT:
{context}

USER QUESTION: {query}

ANSWER (start directly with the answer, do not repeat the question):"""
    return prompt


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

def get_rag_response(query: str) -> Dict[str, Any]:
    """Get response using RAG system"""
    global rag_system, llm_client
    
    if rag_system is None:
        initialize_rag()
    
    # Retrieve relevant documents
    retrieved_docs = rag_system.retrieve(query, top_k=5)
    
    if not retrieved_docs:
        return {
            'response': "I couldn't find specific information about that. Please contact us at info@vwat.org or +1-647-343-8928 for assistance.",
            'retrieved_docs': [],
            'context': ''
        }
    
    # Generate context
    context = rag_system.generate_context(retrieved_docs)
    
    # Create prompt
    prompt = create_rag_prompt(query, context)
    
    # Generate response
    response = llm_client.generate(prompt)
    
    # Convert newlines to HTML breaks for proper display
    if response and "Error" not in response and "trouble connecting" not in response:
        response = response.replace('\n', '<br>')
    
    # If LLM fails, use the top retrieved document as fallback
    if "Error" in response or "trouble connecting" in response:
        # Extract answer from top document
        top_doc = retrieved_docs[0]
        # Clean up the text - if it's FAQ format, extract just the answer
        text = top_doc['text']
        if 'Answer:' in text:
            # Extract answer part from Q&A format
            parts = text.split('Answer:')
            if len(parts) > 1:
                answer = parts[1].strip()
                response = answer
            else:
                response = text
        elif 'Question:' in text and 'Answer:' not in text:
            # If it's just a question without answer, skip it
            response = "I found information about that. Please contact us at info@vwat.org or +1-647-343-8928 for details."
        else:
            response = text
        
        # Format the response with HTML line breaks for better display
        response = response.replace('\n', '<br>')
    
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
