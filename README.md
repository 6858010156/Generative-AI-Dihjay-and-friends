# Local AI Assistant — Codex / Ollama Lab

A local Flask web application that chats with Ollama `gemma3:1b` and stores a conversation history in the browser. Includes clickable answer links and a basic local document upload/delete manager.

## Setup (Mac)

1. Install Python 3 and [Ollama](https://ollama.com/download).
2. In Terminal, run `ollama pull gemma3:1b` and ensure Ollama is running.
3. In the project directory, run:

   ```bash
   python3 -m pip install -r requirements.txt
   python3 app.py
   ```

4. Visit http://127.0.0.1:5000/ in your browser.

## Files

Use the upload section for `.txt`, `.md`, or `.pdf` files up to 10 MB. They are saved locally in `uploads/` and can be deleted in the interface. **These files are not yet fed to the model**: this lab only implements a basic file manager, not RAG.

## Notes

- Ollama runs locally at `http://127.0.0.1:11434`.
- Flask binds only to `127.0.0.1`, so this is a local demo, not a deployed website.
- Do not commit private documents, API keys, or the `uploads/` directory.
