from pathlib import Path
from urllib.parse import urlparse
import json
import os
import uuid

import requests
from flask import Flask, jsonify, render_template, request, send_from_directory
from werkzeug.utils import secure_filename

BASE = Path(__file__).resolve().parent
UPLOADS = BASE / 'uploads'
UPLOADS.mkdir(exist_ok=True)
ALLOWED = {'.txt', '.md', '.pdf'}
MAX_BYTES = 10 * 1024 * 1024
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_BYTES

@app.get('/')
def index():
    return render_template('index.html')

@app.get('/api/files')
def files():
    return jsonify({'files': sorted(p.name for p in UPLOADS.iterdir() if p.is_file())})

@app.post('/api/files')
def upload():
    f = request.files.get('file')
    if not f or not f.filename:
        return jsonify({'error': 'Choose a file.'}), 400
    name = secure_filename(f.filename)
    if not name or Path(name).suffix.lower() not in ALLOWED:
        return jsonify({'error': 'Only .txt, .md, and .pdf are supported.'}), 400
    target = UPLOADS / name
    if target.exists():
        target = UPLOADS / f'{Path(name).stem}-{uuid.uuid4().hex[:6]}{Path(name).suffix}'
    f.save(target)
    return jsonify({'filename': target.name}), 201

@app.delete('/api/files/<path:filename>')
def delete(filename):
    name = secure_filename(filename)
    if name != filename:
        return jsonify({'error': 'Invalid filename.'}), 400
    target = UPLOADS / name
    if not target.is_file():
        return jsonify({'error': 'File not found.'}), 404
    target.unlink()
    return jsonify({'deleted': name})

@app.post('/api/chat')
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get('messages')
    if not isinstance(messages, list) or not messages or len(messages) > 100:
        return jsonify({'error': 'Provide a non-empty message history (max 100).'}), 400
    if any(not isinstance(m, dict) or m.get('role') not in ('user', 'assistant') or not isinstance(m.get('content'), str) or len(m['content']) > 10000 for m in messages):
        return jsonify({'error': 'Invalid messages.'}), 400
    try:
        response = requests.post('http://127.0.0.1:11434/api/chat', json={
            'model': 'gemma3:1b', 'messages': messages, 'stream': False
        }, timeout=180)
        response.raise_for_status()
        answer = response.json().get('message', {}).get('content', '')
        return jsonify({'answer': answer})
    except requests.RequestException as exc:
        return jsonify({'error': 'Cannot reach Ollama or the model failed. Start Ollama and run: ollama pull gemma3:1b. Details: ' + str(exc)}), 502
    except (ValueError, KeyError):
        return jsonify({'error': 'Ollama returned an invalid response.'}), 502

@app.errorhandler(413)
def too_large(_):
    return jsonify({'error': 'File exceeds 10 MB.'}), 413

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
