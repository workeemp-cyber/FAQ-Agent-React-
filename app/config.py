import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
CHAT_BACKEND = os.getenv("CHAT_BACKEND", "ollama").strip().lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Helix Support")
ESCALATE_DISTANCE = float(os.getenv("ESCALATE_DISTANCE", "1.2"))

CHROMA_DIR = str(ROOT / "chroma_db")
FAQ_PATH = ROOT / "data" / "faqs.json"
QUERIES_PATH = ROOT / "data" / "queries.json"
