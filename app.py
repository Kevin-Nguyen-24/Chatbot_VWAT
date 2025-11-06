from flask import Flask, render_template, request, jsonify, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('chatbot.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat messages from the frontend.
    Expects JSON with 'message' field.
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        # TODO: Add your chatbot logic here
        # For now, returning a simple echo response
        bot_response = f"You said: {user_message}"
        
        return jsonify({
            'response': bot_response,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'response': 'Sorry, an error occurred.',
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)
