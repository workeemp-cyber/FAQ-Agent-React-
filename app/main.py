from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import CHAT_BACKEND, COMPANY_NAME, OLLAMA_CHAT_MODEL, ROOT
from app.store import load_queries, set_checked
from app.agent import reply

app = FastAPI(title=f"{COMPANY_NAME} Agent")
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


class ChatIn(BaseModel):
    session_id: str
    message: str


class CheckIn(BaseModel):
    checked: bool


@app.get("/")
def home():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/dashboard")
def dashboard():
    return FileResponse(ROOT / "static" / "dashboard.html")


@app.get("/api/settings")
def settings():
    return {
        "company_name": COMPANY_NAME,
        "chat_backend": CHAT_BACKEND,
        "chat_model": OLLAMA_CHAT_MODEL if CHAT_BACKEND == "ollama" else "openai/gpt-oss-20b",
    }


@app.post("/api/chat")
def chat(body: ChatIn):
    text = body.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message is empty")
    try:
        return reply(body.session_id, text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/queries")
def queries():
    return load_queries()


@app.patch("/api/queries/{query_id}")
def check_query(query_id: str, body: CheckIn):
    item = set_checked(query_id, body.checked)
    if item is None:
        raise HTTPException(status_code=404, detail="Query not found")
    return item
