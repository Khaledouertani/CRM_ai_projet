import pymysql
from typing import List, Dict, Any
from datetime import datetime

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    content TEXT,
                    is_urgent BOOLEAN DEFAULT FALSE,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_at DATETIME NULL
                )
            """)
        conn.commit()
    except Exception as e:
        print(f"Error initializing messages DB: {e}")
    finally:
        conn.close()

# Initialize the table when module is imported
init_db()

def get_conversations_for_user(user_id: int) -> List[Dict[str, Any]]:
    """
    Returns all users (agents + admin) with the last message and unread count 
    for the current user.
    """
    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Get all users except the current one
            cur.execute("SELECT id, name, role FROM users WHERE id != %s", (user_id,))
            other_users = cur.fetchall()
            
            conversations = []
            for u in other_users:
                # Get last message
                cur.execute("""
                    SELECT content, created_at 
                    FROM messages 
                    WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at DESC LIMIT 1
                """, (user_id, u['id'], u['id'], user_id))
                last_msg = cur.fetchone()
                
                # Get unread count (messages sent BY the other user TO the current user that are NOT read)
                cur.execute("""
                    SELECT COUNT(*) as unread_count 
                    FROM messages 
                    WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE
                """, (u['id'], user_id))
                unread = cur.fetchone()
                unread_count = unread['unread_count'] if unread else 0
                
                conversations.append({
                    "user_id": u['id'],
                    "user_name": u['name'],
                    "user_role": u['role'],
                    "last_message": last_msg['content'] if last_msg else "Aucun message",
                    "last_message_time": str(last_msg['created_at']) if last_msg else "",
                    "unread_count": unread_count
                })
                
            # Sort by last_message_time descending
            conversations.sort(key=lambda x: x['last_message_time'], reverse=True)
            return conversations
    finally:
        conn.close()

def get_messages(user1_id: int, user2_id: int) -> List[Dict[str, Any]]:
    """
    Get all messages between two users
    """
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_urgent, m.is_read, m.created_at, m.read_at,
                       s.name as sender_name, r.name as receiver_name
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                WHERE (m.sender_id = %s AND m.receiver_id = %s) OR (m.sender_id = %s AND m.receiver_id = %s)
                ORDER BY m.created_at ASC
            """, (user1_id, user2_id, user2_id, user1_id))
            
            messages = cur.fetchall()
            for m in messages:
                m['created_at'] = str(m['created_at'])
                if m['read_at']:
                    m['read_at'] = str(m['read_at'])
            return messages
    finally:
        conn.close()

def save_message(sender_id: int, receiver_id: int, content: str, is_urgent: bool = False) -> Dict[str, Any]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO messages (sender_id, receiver_id, content, is_urgent)
                VALUES (%s, %s, %s, %s)
            """, (sender_id, receiver_id, content, is_urgent))
            conn.commit()
            msg_id = cur.lastrowid
            
            # Fetch the saved message to return it
            cur.execute("""
                SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_urgent, m.is_read, m.created_at, m.read_at,
                       s.name as sender_name, r.name as receiver_name
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                WHERE m.id = %s
            """, (msg_id,))
            msg = cur.fetchone()
            msg['created_at'] = str(msg['created_at'])
            return msg
    finally:
        conn.close()

def mark_message_as_read(message_id: int):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE messages 
                SET is_read = TRUE, read_at = NOW() 
                WHERE id = %s
            """, (message_id,))
        conn.commit()
    finally:
        conn.close()
