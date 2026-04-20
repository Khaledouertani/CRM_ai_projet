from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from models.database import load_data
import os

# ================= EMBEDDINGS =================
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# ================= PATH =================
DB_PATH = "rag_db"

# ================= VECTOR DB =================
db = None


# ================= BUILD INDEX =================
def build_index():
    global db

    data = load_data()

    if data.empty:
        print(" No data found for RAG")
        return None

    documents = []

    for _, row in data.iterrows():

        text = row.get("transcription", "")
        if not text or len(text.strip()) < 5:
            continue

        doc = f"""
        Agent: {row.get('agent_name', '')}
        Sentiment: {row.get('sentiment', '')}
        Score: {row.get('score_percentage', '')}
        Type: {row.get('call_type', '')}
        Summary: {row.get('summary', '')}
        Text: {text}
        """

        documents.append(doc)

    if not documents:
        print(" No valid documents")
        return None

    db = Chroma.from_texts(
        documents,
        embeddings,
        persist_directory=DB_PATH
    )

    db.persist()

    print(" RAG index built")
    return db


# ================= LOAD EXISTING =================
def load_index():
    global db

    if os.path.exists(DB_PATH):
        db = Chroma(
            persist_directory=DB_PATH,
            embedding_function=embeddings
        )
        print(" RAG loaded from disk")
        return db

    return None


# ================= SEARCH =================
def search_docs(question: str):
    global db

    if db is None:
        db = load_index()

    if db is None:
        db = build_index()

    if db is None:
        return ""

    docs = db.similarity_search(question, k=2)

    return "\n\n".join([d.page_content for d in docs])
    