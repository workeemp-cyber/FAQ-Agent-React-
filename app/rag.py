import json

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings

from app.config import CHROMA_DIR, FAQ_PATH, OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL

_vector_store = None


def get_embeddings():
    return OllamaEmbeddings(
        model=OLLAMA_EMBED_MODEL,
        base_url=OLLAMA_BASE_URL,
    )


def load_faq_docs():
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        faqs = json.load(f)
    docs = []
    for item in faqs:
        text = f"Question: {item['question']}\nAnswer: {item['answer']}"
        docs.append(
            Document(
                page_content=text,
                metadata={
                    "id": item["id"],
                    "category": item.get("category", ""),
                    "question": item["question"],
                },
            )
        )
    return docs


def get_vector_store():
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    embeddings = get_embeddings()
    folder = CHROMA_DIR
    store = Chroma(
        collection_name="faqs",
        embedding_function=embeddings,
        persist_directory=folder,
    )

    existing = store.get().get("ids") or []
    if len(existing) == 0:
        store.add_documents(load_faq_docs())

    _vector_store = store
    return _vector_store


def search_faqs(question, k=3):
    store = get_vector_store()
    results = store.similarity_search_with_score(question, k=k)
    matches = []
    for doc, distance in results:
        matches.append(
            {
                "text": doc.page_content,
                "question": doc.metadata.get("question", ""),
                "category": doc.metadata.get("category", ""),
                "distance": float(distance),
            }
        )
    return matches
