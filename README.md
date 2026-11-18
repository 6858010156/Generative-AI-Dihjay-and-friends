# AI Investment Assistant

**Dihjay and Friends** — a local educational website for understanding AI in investing before risking real money.

## Features

- Beginner-friendly chat powered by local Ollama (`gemma3:1b`).
- All three curated documents are included in every model request; answers are prompted to cite `[1]`, `[2]`, and `[3]`.
- Source library with full document text for checking the model's claims.
- Interactive portfolio simulator with three fictional presets, editable stock/bond returns, a live comparison chart, and gain/loss breakdown.
- Clearly labelled document-excerpt fallback if Ollama or the model is unavailable.
- Responsive layout, accessible labels, keyboard submission, and a new-conversation button.

## Run on a Mac

Requires Python 3.9+ and [Ollama](https://ollama.com/download).

1. Download this repository and unzip it.
2. Open Ollama, then in Terminal run `ollama pull gemma3:1b` once.
3. In the project folder run:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
bash start-demo.command
```

4. Open **http://127.0.0.1:5050** in Safari. Keep the Terminal window open during the demo; press Control+C to stop.

After the first setup, run `bash start-demo.command` again to restart. On the prepared project Mac, a project-local Ollama runtime and model are stored in `.runtime/`; the launcher also supports that setup. Runtime/model files and `.venv/` are not part of GitHub. If port 5050 is already in use, stop the prior instance, or run `PORT=5051 bash start-demo.command` and use port 5051 in Safari.

## A short class demonstration

1. Ask: “Can machine learning predict stock prices accurately?”
2. Read the answer, its limitations, and a supporting source document.
3. Ask: “What is the difference between backtesting and paper trading?”
4. In the simulator select a decline scenario and compare 100% stock exposure with 60%.
5. Edit stock and bond returns to create a custom scenario; compare your mix with 100% stocks and 100% bonds on the chart.
6. Explain why simulated outcomes and model predictions do not guarantee future profits.

## How grounding works

Browser → Flask → three curated text documents + conversation → local Ollama → answer.

This prototype uses full-document context, not a vector database or embedding retrieval pipeline. The corpus is small (about 4.5 KB), so all three sources fit in the model context. The last 12 conversation messages are supplied. The source buttons show the documents supplied to the model; they are not proof that every generated claim is supported. Prompting and citations reduce ambiguity but do not eliminate hallucinations, and a 1B model has limited reasoning capability. The source documents' external references have not been independently validated by this implementation.

If generation fails, the app ranks paragraphs by overlapping question terms and quotes up to three. The interface explicitly identifies this as document mode, not AI generation. It does not invent a fallback answer.

## Simulation assumptions

A deterministic, one-period weighted return calculator, not a predictive model, live market feed, or trade execution system. Starting capital is $100–$1,000,000. Fictional presets use stock/bond returns of +12%/+3%, −20%/+2%, or +2%/−3%. Users can edit either return from −100% to +1,000% (a UI limit, not an expected range), and adjust stock allocation from 0% to 100% in 1% steps. All returns apply once over the same hypothetical period. The chart compares ending values for the chosen mix, 100% stocks, and 100% bonds on a shared zero-based scale, with a starting-capital marker. The breakdown shows each asset’s invested amount and gain/loss. Reset restores $10,000, 60% stocks, and the growth preset. Fees, taxes, inflation, rebalancing, and intraperiod fluctuations are excluded. Bonds can also lose value.

## Source files

- `ai_portfolio_management.txt` — source [1]
- `ai_trading_simulator.txt` — source [2]
- `ml_stock_prediction_and_risks.txt` — source [3]

The original local upload/list/delete API is retained for compatibility. Uploaded files are stored in `uploads/` and **are not included in AI context**. The website uses only the three curated files above.

## Validation

```sh
.venv/bin/python -B -m unittest -v test_app
```

Tests cover page/assets/source loading, request validation, inclusion of documents in the model request, citation metadata, offline fallback, and unrelated-question behavior. Tests mock the model; a live-model demo is a separate check.

## Privacy and scope

The Flask server binds to `127.0.0.1` only. AI requests go to local Ollama at `127.0.0.1:11434`; no cloud AI key is required. Chat history is in page memory and clears on refresh. Model and dependency downloads require an internet connection for initial setup. This is a local demonstration, not production hosting. Do not publish `.venv/`, `.runtime/`, uploads, logs, credentials, or private documents.

## Team

- Kunanont Pruksananont
- Jakkarin Moran
- Phacharapon Limpiboon
- Pongsakorn Kiatthamarat

Educational use only; not personalized financial advice.
