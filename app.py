from flask import Flask, render_template, request, jsonify, send_from_directory, Response, stream_with_context
import os
import json
import time
import signal
import sys
import atexit
import csv
from datetime import datetime
from rag_system import initialize_rag, get_rag_response, cleanup_rag, detect_query_language

app = Flask(__name__)

# Conversation CSV file path
CONVERSATION_CSV = os.path.join('data', 'conversation.csv')

def init_conversation_csv():
    """Initialize the conversation CSV file with headers if it doesn't exist"""
    if not os.path.exists(CONVERSATION_CSV):
        try:
            with open(CONVERSATION_CSV, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.writer(f)
                writer.writerow(['User_ID', 'Day', 'Question', 'Answer'])
            print(f"Created conversation log: {CONVERSATION_CSV}")
        except Exception as e:
            print(f"Error creating conversation CSV: {e}")

def save_conversation_to_csv(timestamp, language, question, answer, sources, user_id='anonymous'):
    """Save a conversation exchange to CSV file"""
    try:
        # Remove HTML breaks from answer for cleaner CSV storage
        clean_answer = answer.replace('<br>', '\n')
        
        # Extract just the date from timestamp (YYYY-MM-DD)
        day = timestamp.split(' ')[0]
        
        # Append to CSV with user_id as first column
        with open(CONVERSATION_CSV, 'a', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow([user_id, day, question, clean_answer])
        
        print(f"Saved conversation to CSV: [User: {user_id}] {question[:50]}...")
    except Exception as e:
        print(f"ERROR: Failed to save conversation to CSV: {e}")

# Cleanup handler for graceful shutdown
def cleanup_handler(signum=None, frame=None):
    """Clean up resources before exit"""
    print("\nShutting down gracefully...")
    cleanup_rag()
    print("Cleanup complete")
    if signum is not None:
        sys.exit(0)

# Register cleanup handlers
atexit.register(cleanup_handler)
signal.signal(signal.SIGINT, cleanup_handler)  # Handle Ctrl+C
signal.signal(signal.SIGTERM, cleanup_handler)  # Handle termination

# Initialize conversation CSV
init_conversation_csv()

# Initialize RAG system on startup
print("Initializing RAG system...")
try:
    initialize_rag()
    print("RAG system initialized!")
except Exception as e:
    print(f"ERROR: Failed to initialize RAG system: {e}")
    print("\nTroubleshooting steps:")
    print("1. Check if another Python process is running")
    print("2. Delete ./qdrant_data/.lock if it exists")
    print("3. Restart the application")
    sys.exit(1)

@app.route('/')
def index():
    return render_template('chatbot.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

@app.route('/log_interaction', methods=['POST'])
def log_interaction():
    """
    Log button click interactions (user selections) to CSV.
    This captures UI interactions that don't go through the chat endpoint.
    """
    try:
        data = request.get_json()
        user_selection = data.get('selection', '')
        bot_response = data.get('response', '')
        language = data.get('language', 'vi')
        user_id = data.get('user_id', 'anonymous')
        
        if user_selection.strip():
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Save to CSV
            save_conversation_to_csv(
                timestamp=timestamp,
                language=language,
                question=user_selection,
                answer=bot_response,
                sources=[],  # Button interactions don't have RAG sources
                user_id=user_id
            )
        
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error logging interaction: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat messages from the frontend using RAG.
    Expects JSON with 'message' and 'language' fields.
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        # Detect language from the user's message so we always reply in the same language
        language = data.get('language', 'vi')  # initial value (may be overridden)
        
        if not user_message.strip():
            error_msg = 'Vui lòng nhập câu hỏi.' if language == 'vi' else 'Please enter a question.'
            return jsonify({
                'response': error_msg,
                'status': 'error'
            })
        
        # Get user ID from request
        user_id = data.get('user_id', 'anonymous')
        
        # Generate timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Log user query to file immediately
        try:
            log_file = os.path.join('data', 'user.txt')
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"[{timestamp}] [{user_id}] [{language}] {user_message}\n")
                f.flush()  # Ensure immediate write to disk
                os.fsync(f.fileno())  # Force write to disk
            print(f"Logged user query: [{user_id}] {user_message[:50]}...")  # Debug confirmation
        except Exception as log_error:
            print(f"ERROR: Failed to log user query: {log_error}")
        
        # Force response language to match the user's message
        try:
            language = detect_query_language(user_message)
        except Exception:
            # Fallback to previously provided language if detection fails
            language = language if language in ('vi','en') else 'en'
        
        # Use RAG system to generate response with language parameter
        rag_result = get_rag_response(user_message, language)
        
        # Prepare sources for response
        sources = [{
            'source': doc['source'],
            'score': doc['score']
        } for doc in rag_result['retrieved_docs'][:3]]  # Return top 3 sources
        
        # Save conversation to CSV
        save_conversation_to_csv(
            timestamp=timestamp,
            language=language,
            question=user_message,
            answer=rag_result['response'],
            sources=sources,
            user_id=user_id
        )
        
        return jsonify({
            'response': rag_result['response'],
            'status': 'success',
            'sources': sources
        })
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        error_msg = 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ chúng tôi tại info@vwat.org hoặc +1-647-343-8928.' if data.get('language') == 'vi' else 'Sorry, I encountered an error. Please try again or contact us directly at info@vwat.org or +1-647-343-8928.'
        return jsonify({
            'response': error_msg,
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Disable reloader to prevent Qdrant locking issues
    # Use environment PORT for cloud deployment, default to 8000 for local
    port = int(os.environ.get('PORT', 8000))
    host = os.environ.get('HOST', '0.0.0.0')  # 0.0.0.0 for cloud, localhost for local
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    app.run(debug=debug, host=host, port=port, use_reloader=False)
