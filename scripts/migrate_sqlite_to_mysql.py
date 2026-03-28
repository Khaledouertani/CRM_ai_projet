import sqlite3
import pymysql
import os

def migrate():
    # 1. Fetch data from SQLite
    if not os.path.exists("crm.db"):
        print("No crm.db found to migrate.")
        return

    sqlite_conn = sqlite3.connect("crm.db")
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT * FROM calls")
    rows = sqlite_cursor.fetchall()
    
    # Get column names to build dictionary
    col_names = [description[0] for description in sqlite_cursor.description]
    sqlite_calls = [dict(zip(col_names, row)) for row in rows]
    sqlite_conn.close()

    print(f"Fetched {len(sqlite_calls)} calls from SQLite.")

    # 2. Connect to MySQL
    try:
        mysql_conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='pfe_crm_ia',
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print("Failed connecting to MySQL:", e)
        return

    with mysql_conn.cursor() as cursor:
        # 3. Alter 'calls' table to support Streamlit application logic
        missing_columns = {
            "sentiment_score": "FLOAT",
            "score_percentage": "FLOAT",
            "performance": "VARCHAR(50)",
            "summary": "TEXT",
            "keywords": "TEXT",
            "call_type": "VARCHAR(50)",
            "problem": "VARCHAR(50)"
        }
        
        # Check existing columns
        cursor.execute("DESCRIBE calls")
        existing_cols = [c['Field'] for c in cursor.fetchall()]

        for col, col_type in missing_columns.items():
            if col not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE calls ADD COLUMN {col} {col_type}")
                    print(f"Added column {col} to calls")
                except Exception as e:
                    print(f"Error adding {col}:", e)
        
        # 4. Migrate Agents
        agents = set(call['agent_name'] for call in sqlite_calls if call.get('agent_name'))
        agent_mapping = {} # To map name -> agent_id
        
        for name in agents:
            # Create a slug/ID for the agent
            agent_id = name.lower().replace(" ", "_")
            agent_mapping[name] = agent_id
            
            # Check if agent exists
            cursor.execute("SELECT id FROM agents WHERE agent_id = %s", (agent_id,))
            if not cursor.fetchone():
                try:
                    cursor.execute(
                        "INSERT INTO agents (agent_id, name, created_at) VALUES (%s, %s, NOW())",
                        (agent_id, name)
                    )
                except Exception as e:
                    print(f"Failed inserting agent {name}:", e)
        
        # 5. Migrate Calls
        for call in sqlite_calls:
            try:
                # Use current logic matching SQLite names to MySQL where applicable
                agent_id = agent_mapping.get(call.get("agent_name", "unknown"), "unknown")
                
                cursor.execute("""
                    INSERT INTO calls (
                        agent_id, agent_name, audio_file, transcription, sentiment, 
                        sentiment_score, score_percentage, performance, summary, 
                        keywords, call_type, problem, call_date, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    )
                """, (
                    agent_id,
                    call.get("agent_name", "Unknown"),
                    call.get("audio_path", ""),
                    call.get("transcription", ""),
                    call.get("sentiment", ""),
                    call.get("sentiment_score", 0.0),
                    call.get("score_percentage", 0.0),
                    call.get("performance", ""),
                    call.get("summary", ""),
                    call.get("keywords", ""),
                    call.get("call_type", ""),
                    call.get("problem", ""),
                    call.get("call_time", None) # mapping call_time -> call_date
                ))
            except Exception as e:
                print(f"Failed inserting call: {e}")

        mysql_conn.commit()
    mysql_conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
