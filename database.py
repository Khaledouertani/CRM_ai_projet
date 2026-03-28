import sqlite3
import pandas as pd

# =========================
# CREATION DB
# =========================

def create_db():
    conn = sqlite3.connect("crm.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calls (
        call_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT,
        audio_path TEXT,
        transcription TEXT,
        sentiment TEXT,
        sentiment_score REAL,
        score_percentage REAL,
        performance TEXT,
        summary TEXT,
        keywords TEXT,
        call_type TEXT,
        problem TEXT,
        call_time TEXT
    )
    """)

    conn.commit()
    conn.close()


# =========================
# INSERT
# =========================

def insert_call(data):
    conn = sqlite3.connect("crm.db")
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO calls (
        agent_name, audio_path, transcription, sentiment,
        sentiment_score, score_percentage, performance,
        summary, keywords, call_type, problem, call_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["agent_name"],
        data["audio_path"],
        data["transcription"],
        data["sentiment"],
        data["sentiment_score"],
        data["score_percentage"],
        data["performance"],
        data["summary"],
        data.get("keywords",""),
        data.get("call_type",""),
        data.get("problem",""),
        str(data["call_time"])
    ))

    conn.commit()
    conn.close()


# =========================
# LOAD DATA
# =========================

def load_data():
    conn = sqlite3.connect("crm.db")
    df = pd.read_sql_query("SELECT * FROM calls", conn)
    conn.close()
    return df
