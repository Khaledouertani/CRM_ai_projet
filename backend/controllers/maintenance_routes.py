from fastapi import APIRouter, Header, HTTPException
from typing import Optional
import pymysql
import json
from datetime import datetime

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

def get_user(auth_header: Optional[str]):
    if not auth_header:
        raise HTTPException(status_code=401, detail="Non autorisé")
    # Simple mock check for now
    return {"role": "admin"}

@router.get("/export")
async def export_data(authorization: Optional[str] = Header(None)):
    user = get_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Export calls
            cur.execute("SELECT * FROM calls")
            calls = cur.fetchall()
            
            # Export users
            cur.execute("SELECT id, username, name, role, email FROM users")
            users = cur.fetchall()
            
            # Export leads
            cur.execute("SELECT * FROM leads")
            leads = cur.fetchall()
            
            return {
                "export_date": datetime.now().isoformat(),
                "calls": calls,
                "users": users,
                "leads": leads
            }
    finally:
        conn.close()

@router.post("/import")
async def import_data(data: dict, authorization: Optional[str] = Header(None)):
    user = get_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Clear existing (optional, but safer for full restore)
            cur.execute("DELETE FROM calls")
            cur.execute("DELETE FROM leads")
            
            # Import leads
            for lead in data.get("leads", []):
                cur.execute("INSERT INTO leads (name, phone, status, postal_code, agent_id) VALUES (%s, %s, %s, %s, %s)",
                           (lead['name'], lead['phone'], lead['status'], lead.get('postal_code'), lead.get('agent_id')))
            
            # Import calls
            for call in data.get("calls", []):
                cur.execute("INSERT INTO calls (agent_id, lead_id, duration, status, transcription, sentiment, score) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (call['agent_id'], call.get('lead_id'), call['duration'], call['status'], call.get('transcription'), call.get('sentiment'), call.get('score')))
        
        conn.commit()
        return {"success": True, "message": "Données restaurées avec succès"}
    finally:
        conn.close()

@router.post("/reset")
async def reset_data(authorization: Optional[str] = Header(None)):
    user = get_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM calls")
            cur.execute("DELETE FROM leads")
        conn.commit()
        return {"success": True, "message": "Données réinitialisées"}
    finally:
        conn.close()
