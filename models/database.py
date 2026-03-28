import pymysql
import pandas as pd

def get_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia',
        cursorclass=pymysql.cursors.DictCursor
    )

def create_db():
    # Kept for backward compatibility. Actual DB managed via phpMyAdmin.
    pass

def insert_call(data):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check/Insert Agent
            agent_name = data.get("agent_name", "Unknown")
            agent_id = agent_name.lower().replace(" ", "_")
            
            cursor.execute("SELECT id FROM agents WHERE agent_id = %s", (agent_id,))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO agents (agent_id, name, created_at) VALUES (%s, %s, NOW())",
                    (agent_id, agent_name)
                )

            # Insert Call
            cursor.execute("""
            INSERT INTO calls (
                agent_id, agent_name, audio_file, transcription, sentiment,
                sentiment_score, score_percentage, performance,
                summary, keywords, call_type, problem, call_date, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                agent_id,
                agent_name,
                data.get("audio_path", ""),
                data.get("transcription", ""),
                data.get("sentiment", ""),
                data.get("sentiment_score", 0.0),
                data.get("score_percentage", 0.0),
                data.get("performance", ""),
                data.get("summary", ""),
                data.get("keywords", ""),
                data.get("call_type", ""),
                data.get("problem", ""),
                str(data.get("call_time", ""))
            ))
        conn.commit()
    except Exception as e:
        print("Database insert_call error:", e)
    finally:
        conn.close()


def load_data():
    conn = get_connection()
    query = """
    SELECT 
        id as call_id,
        agent_name, 
        audio_file AS audio_path, 
        transcription, 
        sentiment,
        sentiment_score, 
        score_percentage, 
        performance, 
        summary, 
        keywords, 
        call_type, 
        problem, 
        call_date AS call_time 
    FROM calls
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df
