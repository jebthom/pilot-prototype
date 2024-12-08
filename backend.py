from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
import os

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

def create_app():
    app = Flask(__name__, static_folder='build', static_url_path='')
    CORS(app)

    # Database Configuration
    # Get DATABASE_URL from environment, use SQLite as fallback for local development
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Heroku provides PostgreSQL URLs starting with postgres://, but SQLAlchemy needs postgresql://
        database_url = database_url.replace('postgres://', 'postgresql://')
    else:
        # Local SQLite database
        database_url = 'sqlite:///app.db'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize SQLAlchemy and Migrate
    db.init_app(app)
    migrate.init_app(app, db)

    return app

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

# Database Models
class CompletionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    input_text = db.Column(db.Text, nullable=False)
    response_text = db.Column(db.Text, nullable=False)

class TextSnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    text = db.Column(db.Text, nullable=False)

app = create_app()

@app.before_request
def log_request():
    print(f"Received request for {request.path}")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    full_path = os.path.join(app.static_folder, path)
    exists = os.path.exists(full_path)
    print(f"Requested path: {path}, Full path: {full_path}, Exists: {exists}")
    if path != "" and exists:
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/condition1')
@app.route('/condition2')
@app.route('/condition3')
@app.route('/condition4')
@app.route('/condition5')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/generate-text', methods=['POST'])
def generate_text():
    input_text = request.json['text']
    cursor_position = request.json['cursorPosition']
    userId = request.json.get('userId', 'unknown')  # Default to 'unknown' if not provided
    
    # Extract text up to the cursor position for context
    context_text = input_text[:cursor_position]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Suggest a continuation for this prompt. Your reply should only be the continuation. The continuation should be grammatically correct and flow naturally from the prompt. The continuation should be paragraph-length."},
                {"role": "user", "content": context_text}
            ],
            max_tokens=250  # Limit the length of the suggestion
        )
        suggestion = response.choices[0].message.content.strip()
        
        # Log the completion to the database
        completion_log = CompletionLog(
            userId=userId,
            input_text=context_text,
            response_text=suggestion
        )
        db.session.add(completion_log)
        db.session.commit()
        
        return jsonify({'response': suggestion}), 200
    except Exception as e:
        # Log errors but don't prevent the response
        print(f"Error logging completion: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/generate-chat-no-text', methods=['POST'])
def generate_chat_no_text():
    chat_history = request.json['chat_history']

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=chat_history,
            max_tokens=150  # Adjust the token limit as needed
        )
        
        assistant_message = response.choices[0].message.content.strip()
        # Append the assistant response to the chat history
        chat_history.append({"role": "assistant", "content": assistant_message})

        return jsonify({'response': assistant_message, 'chat_history': chat_history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/save-snapshot', methods=['POST'])
def save_snapshot():
    try:
        data = request.json
        user_id = data.get('userId', 'unknown')
        text = data.get('text', '')
        
        # Create new snapshot
        snapshot = TextSnapshot(
            userId=user_id,
            text=text
        )
        
        db.session.add(snapshot)
        db.session.commit()
        
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error saving snapshot: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False)