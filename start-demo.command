#!/bin/bash
set -e
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/python -m pip install -r requirements.txt
fi
OLLAMA_BIN=""
if [ -x .runtime/ollama ]; then
  OLLAMA_BIN="$PWD/.runtime/ollama"
  export OLLAMA_MODELS="$PWD/.runtime/models"
elif command -v ollama >/dev/null 2>&1; then
  OLLAMA_BIN="$(command -v ollama)"
fi
MODEL_PID=""
cleanup() { if [ -n "$MODEL_PID" ]; then kill "$MODEL_PID" 2>/dev/null || true; fi; }
trap cleanup EXIT
if [ -n "$OLLAMA_BIN" ] && ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  "$OLLAMA_BIN" serve > ollama.log 2>&1 &
  MODEL_PID=$!
  sleep 3
fi
printf '\nAI Investment Assistant\nOpen http://127.0.0.1:5050 in Safari.\nKeep this window open. Press Control+C to stop.\n\n'
.venv/bin/python app.py
