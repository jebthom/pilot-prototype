
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/generate-text', methods=['POST'])
def generate_text():
    input_text = request.json['text']
    cursor_position = request.json['cursorPosition']
    # Extract text up to the cursor position for context
    context_text = input_text[:cursor_position]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            # model='llama3',
            messages=[
                {"role": "system", "content": "Suggest a continuation for this prompt. Your reply should only be the continuation. The continuation should be grammatically correct and flow naturally from the prompt. The continuation should be paragraph-length."},
                {"role": "user", "content": context_text}
            ],
            max_tokens=250  # Limit the length of the suggestion
        )
        suggestion = response.choices[0].message.content.strip()
        return jsonify({'response': suggestion}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False)