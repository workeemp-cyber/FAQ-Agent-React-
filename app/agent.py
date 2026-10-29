from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

from app.config import (
    CHAT_BACKEND,
    COMPANY_NAME,
    ESCALATE_DISTANCE,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_BASE_URL,
    OLLAMA_CHAT_MODEL,
)
from app.rag import search_faqs
from app.store import add_message, add_query, get_history

ESCALATE_WORDS = [
    "human",
    "agent",
    "person",
    "escalate",
    "manager",
    "not helpful",
    "talk to someone",
]


def groq_ready():
    return bool(GROQ_API_KEY) and GROQ_API_KEY.startswith("gsk_") and "your_groq" not in GROQ_API_KEY


def get_llm(backend=None):
    name = backend or CHAT_BACKEND
    if name == "groq":
        if not groq_ready():
            raise ValueError("GROQ_API_KEY is missing or invalid.")
        return ChatGroq(
            model="openai/gpt-oss-20b",
            groq_api_key=GROQ_API_KEY,
            temperature=0.2,
        )
    return ChatOllama(
        model=OLLAMA_CHAT_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.2,
    )


def wants_human(text):
    lower = text.lower()
    for word in ESCALATE_WORDS:
        if word in lower:
            return True
    return False


def build_context(matches):
    if not matches:
        return "No FAQ matches found."
    parts = []
    for i, item in enumerate(matches, start=1):
        parts.append(f"FAQ {i} (distance {item['distance']:.3f}):\n{item['text']}")
    return "\n\n".join(parts)


def invoke_llm(messages):
    if CHAT_BACKEND == "groq" and groq_ready():
        try:
            return get_llm("groq").invoke(messages), "groq"
        except Exception as exc:
            if "invalid_api_key" not in str(exc).lower() and "401" not in str(exc):
                raise
    result = get_llm("ollama").invoke(messages)
    return result, "ollama"


def reply(session_id, question):
    matches = search_faqs(question)
    best_distance = matches[0]["distance"] if matches else 99
    low_match = best_distance > ESCALATE_DISTANCE
    ask_human = wants_human(question)

    history = get_history(session_id)
    system = SystemMessage(
        content=(
            f"You are a customer support agent for {COMPANY_NAME}. "
            "Answer using the FAQ context and the chat history. "
            "Keep answers short and clear. "
            "If the FAQs do not cover the question, say you will escalate to a human. "
            "Do not invent company policies."
        )
    )

    messages = [system]
    messages.append(HumanMessage(content=f"FAQ context:\n{build_context(matches)}"))
    for item in history:
        if item["role"] == "user":
            messages.append(HumanMessage(content=item["text"]))
        else:
            messages.append(AIMessage(content=item["text"]))
    messages.append(HumanMessage(content=question))

    result, backend = invoke_llm(messages)
    answer = result.content.strip()

    escalated = ask_human or low_match
    reason = ""
    if ask_human:
        reason = "Customer asked for a human"
        if "escalate" not in answer.lower() and "team" not in answer.lower():
            answer += " I am connecting you with a human teammate."
    elif low_match:
        reason = "No close FAQ match"
        if "escalate" not in answer.lower():
            answer += " I could not find a confident FAQ match, so this is marked for a human review."

    add_message(session_id, "user", question)
    add_message(session_id, "assistant", answer)
    saved = add_query(session_id, question, answer, escalated, reason)

    return {
        "answer": answer,
        "escalated": escalated,
        "reason": reason,
        "backend": backend,
        "query_id": saved["id"],
        "matches": [
            {
                "question": m["question"],
                "category": m["category"],
                "distance": round(m["distance"], 3),
            }
            for m in matches
        ],
    }
