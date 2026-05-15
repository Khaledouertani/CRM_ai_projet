"""
controllers/calls_routes.py
==========================
Routes for managing calls data in CRM AI Backend.
Provides GET endpoints for calls with role-based filtering.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import pymysql
import json
from datetime import datetime

router = APIRouter(prefix="/api/calls", tags=["calls"])


def get_db_connection():
    """Get MySQL connection."""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia',
        cursorclass=pymysql.cursors.DictCursor
    )


def verify_admin(token: str) -> bool:
    """Verify if user is admin."""
    from services.auth_service import verify_token
    user_info = verify_token(token)
    return user_info and user_info.get("role") == "admin"


def verify_auth(token: str) -> Optional[dict]:
    """Verify token and return user info."""
    from services.auth_service import verify_token
    return verify_token(token)


@router.get("")
async def get_calls(
    authorization: Optional[str] = Header(None),
    agent_name: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    """
    Get calls list with role-based filtering.

    GET /api/calls
    GET /api/calls?agent_name=ali&limit=10
    GET /api/calls?sentiment=NEGATIVE

    Admin: Returns all calls
    Agent: Returns only own calls

    Headers: Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    user_info = verify_auth(token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            # Build query based on role
            if user_info.get("role") == "admin":
                # Admin: can see all calls, optional filter by agent_name
                where_clause = "WHERE 1=1"
                params = []

                if agent_name:
                    where_clause += " AND agent_name = %s"
                    params.append(agent_name)
                if sentiment:
                    where_clause += " AND sentiment = %s"
                    params.append(sentiment)
            else:
                # Agent: only own calls
                where_clause = "WHERE agent_name = %s"
                params = [user_info.get("username", "")]

                if sentiment:
                    where_clause += " AND sentiment = %s"
                    params.append(sentiment)

            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM calls {where_clause}"
            cur.execute(count_query, params)
            total = cur.fetchone()["total"]

            # Get paginated results
            query = f"""
                SELECT
                    id as call_id,
                    agent_name,
                    audio_file as audio_path,
                    sentiment,
                    sentiment_score,
                    score_percentage,
                    performance,
                    summary,
                    keywords,
                    call_date,
                    created_at
                FROM calls
                {where_clause}
                ORDER BY call_date DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])

            cur.execute(query, params)
            calls = cur.fetchall()

            # Process keywords (JSON string to list)
            for call in calls:
                if call.get("keywords") and isinstance(call["keywords"], str):
                    try:
                        call["keywords"] = json.loads(call["keywords"])
                    except:
                        call["keywords"] = []

            return {
                "calls": calls,
                "total": total,
                "limit": limit,
                "offset": offset,
                "role": user_info.get("role"),
            }

    finally:
        conn.close()


@router.get("/{call_id}")
async def get_call_detail(
    call_id: int,
    authorization: Optional[str] = Header(None),
):
    """
    Get detailed information about a specific call.

    GET /api/calls/{call_id}

    Admin: Can view any call
    Agent: Can view only own calls
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    user_info = verify_auth(token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM calls WHERE id = %s", (call_id,))
            call = cur.fetchone()

            if not call:
                raise HTTPException(status_code=404, detail="Call not found")

            # Check if agent can access this call
            if user_info.get("role") != "admin" and call["agent_name"] != user_info.get("username"):
                raise HTTPException(status_code=403, detail="Access denied")

            # Process keywords
            if call.get("keywords") and isinstance(call["keywords"], str):
                try:
                    call["keywords"] = json.loads(call["keywords"])
                except:
                    call["keywords"] = []

            return call

    finally:
        conn.close()


@router.get("/stats")
async def get_stats(
    authorization: Optional[str] = Header(None),
    agent_name: Optional[str] = Query(None),
):
    """
    Get call statistics.

    GET /api/stats
    GET /api/stats?agent_name=ali

    Admin: Global stats
    Agent: Own stats only
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    user_info = verify_auth(token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            # Build where clause
            if user_info.get("role") == "admin" and agent_name:
                where_clause = "WHERE agent_name = %s"
                params = [agent_name]
            elif user_info.get("role") != "admin":
                where_clause = "WHERE agent_name = %s"
                params = [user_info.get("username", "")]
            else:
                where_clause = ""
                params = []

            # Total calls
            total_query = f"SELECT COUNT(*) as total FROM calls {where_clause}"
            cur.execute(total_query, params)
            total_calls = cur.fetchone()["total"]

            # Average score
            score_query = f"SELECT AVG(score_percentage) as avg_score FROM calls {where_clause}"
            cur.execute(score_query, params)
            avg_score = cur.fetchone()["avg_score"] or 0

            # Sentiment distribution
            sentiment_query = f"""
                SELECT sentiment, COUNT(*) as count
                FROM calls {where_clause}
                GROUP BY sentiment
            """
            cur.execute(sentiment_query, params)
            sentiment_dist = {row["sentiment"]: row["count"] for row in cur.fetchall()}

            # Performance distribution
            perf_query = f"""
                SELECT performance, COUNT(*) as count
                FROM calls {where_clause}
                GROUP BY performance
            """
            cur.execute(perf_query, params)
            perf_dist = {row["performance"]: row["count"] for row in cur.fetchall() if row["performance"]}

            return {
                "total_calls": total_calls,
                "avg_score": round(avg_score, 2),
                "sentiment_distribution": sentiment_dist,
                "performance_distribution": perf_dist,
                "role": user_info.get("role"),
                "agent_name": agent_name or user_info.get("username") if user_info.get("role") != "admin" else None,
            }

    finally:
        conn.close()


@router.get("/agents-summary")
async def get_agents_calls_summary(
    authorization: Optional[str] = Header(None),
):
    """
    Get calls summary grouped by agent (admin only).

    GET /api/agents/calls

    Returns: List of agents with call counts and average scores.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    user_info = verify_auth(token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Only admins can see all agents
    if user_info.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    agent_name,
                    COUNT(*) as total_calls,
                    AVG(score_percentage) as avg_score,
                    SUM(CASE WHEN sentiment = 'POSITIVE' THEN 1 ELSE 0 END) as positive_calls,
                    SUM(CASE WHEN sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) as negative_calls,
                    SUM(CASE WHEN sentiment = 'NEUTRAL' THEN 1 ELSE 0 END) as neutral_calls
                FROM calls
                GROUP BY agent_name
                ORDER BY total_calls DESC
            """)

            agents = []
            for row in cur.fetchall():
                agents.append({
                    "agent_name": row["agent_name"],
                    "total_calls": row["total_calls"],
                    "avg_score": round(row["avg_score"] or 0, 2),
                    "positive_calls": row["positive_calls"],
                    "negative_calls": row["negative_calls"],
                    "neutral_calls": row["neutral_calls"],
                })

            return agents

    finally:
        conn.close()


# ============================================================
# Direct Call Save Endpoint
# ============================================================

class DirectCallCreate(BaseModel):
    contact_id: int
    contact_name: str
    contact_company: str
    phone: str
    email: str
    duration: int
    besoin: str
    budget: str
    interet: str
    notes: str
    statut: str
    call_date: str


@router.post("/save")
async def save_direct_call(
    call_data: DirectCallCreate,
    authorization: Optional[str] = Header(None),
):
    """
    Save a direct call from the contact list.
    
    POST /api/calls/save
    
    Body:
    {
        "contact_id": 1,
        "contact_name": "Jean Dupont",
        "contact_company": "Société ABC",
        "phone": "+33 6 12 34 56 78",
        "email": "j.dupont@societeabc.fr",
        "duration": 120,
        "besoin": "Centre d'appels",
        "budget": "5000€",
        "interet": "Élevé",
        "notes": "Client très intéressé",
        "statut": "Converti",
        "call_date": "2024-01-15T10:30:00"
    }
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    user_info = verify_auth(token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            # Determine sentiment based on interest
            if call_data.statut == "Converti":
                sentiment = "POSITIVE"
                score_percentage = 100
            elif call_data.statut == "Refusé":
                sentiment = "NEGATIVE"
                score_percentage = 0
            else:
                sentiment = "NEUTRAL"
                score_percentage = 50

            # Determine performance
            if call_data.statut == "Converti":
                performance = "Excellent"
            elif call_data.statut == "Rappel":
                performance = "À relancer"
            else:
                performance = "Refusé"

            # Insert the call - only use existing columns
            cur.execute("""
                INSERT INTO calls (
                    agent_id,
                    agent_name,
                    audio_file,
                    transcription,
                    sentiment,
                    sentiment_score,
                    score_percentage,
                    performance,
                    summary,
                    keywords,
                    call_type,
                    customer_intent,
                    problem,
                    next_steps,
                    call_date,
                    created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                )
            """, (
                f"agent_{user_info.get('id')}",
                user_info.get("username"),
                f"direct_call_{call_data.contact_id}_{int(datetime.now().timestamp())}",
                call_data.notes,
                sentiment,
                1.0 if sentiment == "POSITIVE" else (0.0 if sentiment == "NEGATIVE" else 0.5),
                score_percentage,
                performance,
                call_data.notes,
                json.dumps({"besoin": call_data.besoin, "budget": call_data.budget, "interet": call_data.interet}),
                "Direct",
                call_data.besoin,
                f"Budget: {call_data.budget} | Intérêt: {call_data.interet}",
                call_data.notes,
                call_data.call_date,
            ))

            conn.commit()

            # Get the inserted ID
            call_id = cur.lastrowid

            return {
                "success": True,
                "call_id": call_id,
                "message": "Appel sauvegardé avec succès"
            }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save call: {str(e)}")

    finally:
        conn.close()