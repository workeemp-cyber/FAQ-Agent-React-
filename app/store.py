import json
import uuid
from datetime import datetime, timezone
from app.config import QUERIES_PATH

conversations = {}


def _now():
    return datetime.now(timezone.utc).isoformat()


def load_queries():
    if not QUERIES_PATH.exists():
        return []
    with open(QUERIES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_queries(items):
    QUERIES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(QUERIES_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)


def add_query(session_id, question, answer, escalated, reason=""):
    items = load_queries()
    item = {
        "id": str(uuid.uuid4())[:8],
        "session_id": session_id,
        "question": question,
        "answer": answer,
        "escalated": escalated,
        "reason": reason,
        "checked": False,
        "created_at": _now(),
    }
    items.insert(0, item)
    save_queries(items)
    return item


def set_checked(query_id, checked):
    items = load_queries()
    found = None
    for item in items:
        if item["id"] == query_id:
            item["checked"] = bool(checked)
            found = item
            break
    if found is None:
        return None
    save_queries(items)
    return found


def get_history(session_id):
    return conversations.setdefault(session_id, [])


def add_message(session_id, role, text):
    history = get_history(session_id)
    history.append({"role": role, "text": text})
    if len(history) > 12:
        conversations[session_id] = history[-12:]
    return conversations[session_id]
