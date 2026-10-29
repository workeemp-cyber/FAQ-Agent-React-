# FAQ Support Bot — React frontend

This frontend replaces the original HTML/CSS/JavaScript pages while keeping the existing FastAPI + LangChain/RAG backend.

## Requirements
- Node.js 20+ (LTS recommended)
- Python environment and backend dependencies from the project root
- Ollama running with the configured models, or a valid Groq configuration

## Run locally (Windows PowerShell)

Terminal 1 — from the repository root:

```powershell
# Activate your existing Python virtual environment if you have one
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Terminal 2 — from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Vite proxies `/api` requests to the FastAPI server on `http://127.0.0.1:8000`.

## Production build

```powershell
cd frontend
npm run build
```

The build output is written to `frontend/dist`. This starter keeps the React development server separate from FastAPI; deploy the frontend and backend together or configure the frontend hosting to proxy `/api` to the API service.

## Existing API endpoints used
- `GET /api/settings`
- `POST /api/chat`
- `GET /api/queries`
- `PATCH /api/queries/{query_id}`

## Before publishing
- Never commit `.env` or API keys.
- Do not commit `venv/`, `node_modules/`, generated `frontend/dist/`, or the local `chroma_db/` database.
- Keep the root `requirements.txt` for the Python backend and this `package.json` for the React frontend.
