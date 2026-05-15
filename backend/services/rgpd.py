"""
services/rgpd.py
Conformite RGPD - Anonymisation et audit trail
"""

import re
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List
from models.database import get_connection


def anonymize_transcript(text: str) -> str:
    text = re.sub(r'\b(?:\d{4}[-\s]?){3}\d{4}\b', lambda m: "****-****-****-" + m.group()[-4:], text)
    text = re.sub(r'\b0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}\b', '0X XX XX XX XX', text)
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', lambda m: "***@" + m.group().split("@")[1], text)
    text = re.sub(r'\b[A-Z]{2}\d{2}[\s]?(?:\d{4}[\s]?){4,7}\d{1,4}\b', lambda m: m.group()[:4] + " **** **** **** ****", text)
    text = re.sub(r'\bM(?:onsieur|me|ademoiselle)\s+([A-Z][a-z]+)\b', lambda m: m.group(0).replace(m.group(1), "XXX"), text)
    return text


def hash_identifier(identifier: str) -> str:
    return hashlib.sha256(identifier.encode()).hexdigest()[:16]


def delete_old_records(retention_months: int = 12):
    cutoff_date = datetime.now() - timedelta(days=retention_months * 30)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM calls WHERE call_date < %s", (cutoff_date,))
    deleted_calls = cursor.rowcount
    cursor.execute("DELETE FROM logs WHERE timestamp < %s", (cutoff_date,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"deleted_calls": deleted_calls, "deleted_logs": cursor.rowcount}


def log_action(user_id: str, action: str, details: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO logs (user_id, action, details, timestamp) VALUES (%s, %s, %s, %s)
    """, (user_id, action, details, datetime.now()))
    conn.commit()
    cursor.close()
    conn.close()


def get_audit_trail(user_id: str = None, days: int = 30) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cutoff = datetime.now() - timedelta(days=days)
    
    if user_id:
        cursor.execute("""
            SELECT user_id, action, details, timestamp FROM logs
            WHERE user_id = %s AND timestamp > %s ORDER BY timestamp DESC
        """, (user_id, cutoff))
    else:
        cursor.execute("""
            SELECT user_id, action, details, timestamp FROM logs
            WHERE timestamp > %s ORDER BY timestamp DESC
        """, (cutoff,))
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"user_id": r[0], "action": r[1], "details": r[2], "timestamp": r[3].isoformat()} for r in results]