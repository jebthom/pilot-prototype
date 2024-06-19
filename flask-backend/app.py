
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

client = OpenAI(
    base_url='http://localhost:11434/v1/',
    api_key=os.environ.get("OPENAI_API_KEY")
)

app = Flask(__name__)
CORS(app)

@app.route('/generate-text', methods=['POST'])
def generate_text():
    input_text = request.json['text']
    cursor_position = request.json['cursorPosition']
    # Extract text up to the cursor position for context
    context_text = input_text[:cursor_position]

    try:
        response = client.chat.completions.create(
            # model="gpt-3.5-turbo",
            model='llama3',
            messages=[
                {"role": "system", "content": "Suggest a continuation for this prompt. Your reply should only be the continuation. The continuation should be grammatically correct and flow naturally from the prompt."},
                {"role": "user", "content": context_text}
            ],
            max_tokens=50  # Limit the length of the suggestion
        )
        suggestion = response.choices[0].message.content.strip()
        return jsonify({'response': suggestion}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)