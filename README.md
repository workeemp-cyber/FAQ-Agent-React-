# FAQ Support Bot --- React + FastAPI + RAG

A full-stack FAQ support chatbot with a React frontend and a Python
FastAPI backend. The backend uses retrieval-augmented generation (RAG)
to retrieve relevant FAQ information and generate responses through a
configured chat model provider.

## Features

-   React single-page interface built with Vite
-   FastAPI backend with API endpoints for chat, settings, and query
    management
-   RAG pipeline using LangChain and ChromaDB
-   Support for configured Groq or Ollama chat models
-   FAQ data and query-history files in the `data/` directory
-   Dashboard for reviewing and managing saved queries

## Tech stack

  Area                  Technology
  --------------------- ------------------------------------------------
  Frontend              React, React Router, Vite, CSS
  Backend API           Python, FastAPI, Uvicorn
  RAG / orchestration   LangChain
  Vector database       ChromaDB
  Model providers       Groq and/or Ollama, depending on configuration
  Data                  JSON files and a local ChromaDB store

## Project structure

``` text
FAQ-Agent/
├── app/
│   ├── main.py           # FastAPI application and API routes
│   ├── agent.py          # Chat/agent logic
│   ├── rag.py            # Retrieval-augmented generation logic
│   ├── store.py          # Storage/query helpers
│   └── config.py         # Configuration
├── data/
│   ├── faqs.json         # FAQ source data
│   └── queries.json      # Saved query data (if used by the app)
├── frontend/
│   ├── src/              # React components and API client
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── requirements.txt
└── README.md
```

The `static/` directory from the legacy HTML frontend may remain in the
repository during migration. It is not required by the React UI if
FastAPI is no longer serving those pages; verify `app/main.py` before
removing it.

## Prerequisites

-   Python 3.10+ (use the version supported by your installed
    dependencies)
-   Node.js 20+ (LTS recommended) and npm
-   A configured model provider:
    -   **Groq:** a valid API key configured through environment
        variables, or
    -   **Ollama:** Ollama installed and running with the model
        configured by the project

## Setup

### 1. Clone the repository

``` bash
git clone https://github.com/workeemp-cyber/FAQ-Agent.git
cd FAQ-Agent
```

### 2. Create and activate a Python virtual environment

**Windows PowerShell:**

``` powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**macOS / Linux:**

``` bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure model settings

Review `app/config.py` and the environment-variable names expected by
the application. If the app uses a `.env` file, create one locally and
add the required values. Never commit API keys or other secrets.

For Groq, use your own API key. For Ollama, start the Ollama service and
download the model required by your configuration. Do not assume a model
name---check `app/config.py`.

### 4. Install and start the React frontend

In a second terminal, from the repository root:

``` bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

The included Vite configuration proxies `/api` requests to
`http://127.0.0.1:8000`. If your backend runs on a different port,
update `frontend/vite.config.js`.

### 5. Start the FastAPI backend

In the Python terminal, from the repository root:

``` bash
python -m uvicorn app.main:app --reload --port 8000
```

The React frontend and backend must both be running for chat and
dashboard API features to work. If the API does not start, check the
terminal error and the dependency imports in `app/`.

## Production build

From the repository root:

``` bash
cd frontend
npm run build
```

Vite writes the production frontend to `frontend/dist/`.

The Vite development proxy is for local development only. For
deployment, host the frontend and FastAPI backend and configure the
frontend API base/proxy to point to the deployed backend. Set production
environment variables securely and restrict CORS to the intended
frontend origin if cross-origin requests are used.

## API routes

The frontend is currently designed to use these backend routes:

-   `GET /api/settings`
-   `POST /api/chat`
-   `GET /api/queries`
-   `PATCH /api/queries/{query_id}`

Check `app/main.py` for the exact request and response schemas.

## Git hygiene

Do not commit:

-   `.env` files, API keys, passwords, or tokens
-   `.venv/`, `venv/`, `__pycache__/`, or `*.pyc`
-   `frontend/node_modules/` or `frontend/dist/`
-   Local generated vector-store/database files such as `chroma_db/`,
    unless you intentionally want to version a small, non-sensitive
    dataset and have verified it is appropriate to share

Keep source FAQ data that is required to reproduce the project. If the
vector store is generated from the FAQ data, document how to rebuild it
rather than committing machine-specific generated state.

## Troubleshooting

-   **React page is blank:** open browser DevTools → Console and fix the
    first JavaScript error shown.
-   **Network/API errors:** ensure FastAPI is running on port `8000` and
    the Vite proxy target matches.
-   **Model errors:** verify your Groq API key or that Ollama is running
    and the configured model is installed.
-   **Missing Python module:** activate the correct virtual environment
    and run `pip install -r requirements.txt`.

## License

Add a `LICENSE` file if you want to publish this project under an
open-source license. Do not claim a license until you have selected one.
