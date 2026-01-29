from flask import Flask, request, jsonify, send_from_directory
import os
import secrets
from cropllm import detect_disease, get_chat_response_simple

app = Flask(__name__, static_folder='.')

# upload configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/detect-disease', methods=['POST'])
def detect_disease():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = secrets.token_hex(8) + "_" + file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            result = detect_disease(filepath)
            # Cleanup
            # os.remove(filepath) 
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    if not query:
        return jsonify({'response': "I didn't catch that. Could you repeat?"})
    
    response = get_chat_response_simple(query)
    return jsonify({'response': response})

if __name__ == '__main__':
    print("Starting KrishiMitraAI Server...")
    print("Please open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
