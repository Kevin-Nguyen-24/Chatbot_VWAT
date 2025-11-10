from flask import Flask, render_template, request, jsonify, send_from_directory, Response, stream_with_context
import os
import json
import time
from rag_system import initialize_rag, get_rag_response

app = Flask(__name__)

# Initialize RAG system on startup
print("Initializing RAG system...")
initialize_rag()
print("RAG system initialized!")

@app.route('/')
def index():
    return render_template('chatbot.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat messages from the frontend using RAG.
    Expects JSON with 'message' and 'language' fields.
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        language = data.get('language', 'vi')  # Default to Vietnamese
        
        if not user_message.strip():
            error_msg = 'Vui lòng nhập câu hỏi.' if language == 'vi' else 'Please enter a question.'
            return jsonify({
                'response': error_msg,
                'status': 'error'
            })
        
        # Use RAG system to generate response with language parameter
        rag_result = get_rag_response(user_message, language)
        
        return jsonify({
            'response': rag_result['response'],
            'status': 'success',
            'sources': [{
                'source': doc['source'],
                'score': doc['score']
            } for doc in rag_result['retrieved_docs'][:3]]  # Return top 3 sources
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
    app.run(debug=True, host='localhost', port=8000, use_reloader=False)
