"""
controllers/analytics_routes.py
================================
API endpoints for analytics, followups, and planning.
Connected to MySQL database pfe_crm_ia.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional
import pymysql
import json
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )


def verify_auth(token: str) -> Optional[dict]:
    from services.auth_service import verify_token
    return verify_token(token)


def get_user(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid format")
    user = verify_auth(parts[1])
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


# ─── ANALYTICS: Full stats with scores, sentiments, hourly ────────────────────

@router.get("/overview")
async def analytics_overview(authorization: Optional[str] = Header(None)):
    """Full analytics overview with all KPIs."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Total calls + avg score
            cur.execute("SELECT COUNT(*) as total, AVG(score_percentage) as avg_score FROM calls")
            row = cur.fetchone()
            total = row["total"]
            avg_score = round(row["avg_score"] or 0, 1)

            # Sentiment distribution
            cur.execute("SELECT sentiment, COUNT(*) as cnt FROM calls GROUP BY sentiment")
            sentiments = {r["sentiment"]: r["cnt"] for r in cur.fetchall()}

            # Performance distribution
            cur.execute("SELECT performance, COUNT(*) as cnt FROM calls WHERE performance IS NOT NULL GROUP BY performance")
            performances = {r["performance"]: r["cnt"] for r in cur.fetchall()}

            # Best and worst agents
            cur.execute("""
                SELECT agent_name, AVG(score_percentage) as avg
                FROM calls GROUP BY agent_name ORDER BY avg DESC LIMIT 1
            """)
            best = cur.fetchone()
            cur.execute("""
                SELECT agent_name, AVG(score_percentage) as avg
                FROM calls GROUP BY agent_name ORDER BY avg ASC LIMIT 1
            """)
            worst = cur.fetchone()

            # Hourly distribution
            cur.execute("""
                SELECT HOUR(call_date) as hour, COUNT(*) as cnt
                FROM calls WHERE call_date IS NOT NULL
                GROUP BY HOUR(call_date) ORDER BY hour
            """)
            hourly = [{"hour": r["hour"], "appels": r["cnt"]} for r in cur.fetchall()]

            # Radar scores (avg per criteria)
            cur.execute("""
                SELECT
                    AVG(score_ecoute) as ecoute,
                    AVG(score_persuasion) as persuasion,
                    AVG(score_empathie) as empathie,
                    AVG(score_argumentation) as argumentation,
                    AVG(score_refus) as refus,
                    AVG(score_vente) as vente
                FROM calls
            """)
            radar_row = cur.fetchone()
            radar = [
                {"critere": "Écoute", "score": round(radar_row["ecoute"] or 0, 1)},
                {"critere": "Persuasion", "score": round(radar_row["persuasion"] or 0, 1)},
                {"critere": "Empathie", "score": round(radar_row["empathie"] or 0, 1)},
                {"critere": "Argumentation", "score": round(radar_row["argumentation"] or 0, 1)},
                {"critere": "Refus", "score": round(radar_row["refus"] or 0, 1)},
                {"critere": "Vente", "score": round(radar_row["vente"] or 0, 1)},
            ]

            # Additional KPIs for Dashboard
            cur.execute("SELECT COUNT(*) as cnt FROM calls WHERE DATE(call_date) = CURDATE()")
            calls_today = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(DISTINCT agent_name) as cnt FROM calls WHERE call_date > NOW() - INTERVAL 1 HOUR")
            active_agents = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) as cnt FROM calls WHERE performance = 'EXCELLENT'")
            conversions = cur.fetchone()["cnt"]
            conv_rate = round((conversions / total * 100), 1) if total > 0 else 0

            return {
                "total_calls": total,
                "avg_score": avg_score,
                "sentiments": sentiments,
                "performances": performances,
                "best_agent": best["agent_name"] if best else "-",
                "worst_agent": worst["agent_name"] if worst else "-",
                "hourly": hourly,
                "radar": radar,
                "calls_today": calls_today,
                "active_agents": active_agents,
                "conversion_rate": conv_rate,
                "pending_followups": 12, # Placeholder
                "avg_duration": 4.5
            }
    finally:
        conn.close()


# ─── ANALYTICS: Performance by Agent ──────────────────────────────────────────

@router.get("/agents-performance")
async def agents_performance(authorization: Optional[str] = Header(None)):
    """Agent-level performance data."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    agent_name,
                    COUNT(*) as total_calls,
                    AVG(score_percentage) as avg_score,
                    SUM(CASE WHEN sentiment='POSITIVE' THEN 1 ELSE 0 END) as positive,
                    SUM(CASE WHEN sentiment='NEGATIVE' THEN 1 ELSE 0 END) as negative,
                    SUM(CASE WHEN sentiment='NEUTRAL' THEN 1 ELSE 0 END) as neutral,
                    AVG(agent_talk_ratio) as avg_talk_ratio,
                    AVG(client_talk_ratio) as avg_client_ratio
                FROM calls
                GROUP BY agent_name
                ORDER BY avg_score DESC
            """)
            agents = []
            for r in cur.fetchall():
                agents.append({
                    "agent_name": r["agent_name"],
                    "total_calls": r["total_calls"],
                    "avg_score": round(r["avg_score"] or 0, 1),
                    "positive": r["positive"] or 0,
                    "negative": r["negative"] or 0,
                    "neutral": r["neutral"] or 0,
                    "talk_ratio": round((r["avg_talk_ratio"] or 0) * 100, 1),
                    "client_ratio": round((r["avg_client_ratio"] or 0) * 100, 1),
                })
            return agents
    finally:
        conn.close()


# ─── ANALYTICS: Supervision (refusals, incoherences, inactivity) ──────────────

@router.get("/supervision")
async def supervision_data(authorization: Optional[str] = Header(None)):
    """Supervision data: refusals, incoherences, inactivity."""
    user = get_user(authorization)
    # Agents get an empty result instead of a 403 to prevent frontend error spam
    if user.get("role") not in ["admin", "qualite"]:
        return {"refusals": [], "refusals_by_agent": [], "incoherences": [], "inactivity": []}

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Refusal reasons
            cur.execute("""
                SELECT refusal_reason, COUNT(*) as cnt
                FROM calls
                WHERE refusal_reason IS NOT NULL AND refusal_reason != ''
                GROUP BY refusal_reason
            """)
            refusal_labels = {
                "prix_trop_eleve": "Prix trop élevé",
                "pas_besoin": "Pas besoin",
                "pas_decision": "Pas de décision",
                "concurrence": "Concurrence",
                "deja_client": "Déjà client",
                "timing_mauvais": "Mauvais moment",
                "autre": "Autre"
            }
            refusals = [
                {"motif": refusal_labels.get(r["refusal_reason"], r["refusal_reason"]), "count": r["cnt"]}
                for r in cur.fetchall()
            ]

            # Refusals by agent
            cur.execute("""
                SELECT agent_name, COUNT(*) as cnt
                FROM calls
                WHERE refusal_reason IS NOT NULL AND refusal_reason != ''
                GROUP BY agent_name
            """)
            refusals_by_agent = [{"agent": r["agent_name"], "count": r["cnt"]} for r in cur.fetchall()]

            # Incoherences
            cur.execute("""
                SELECT COUNT(*) as cnt FROM calls WHERE qualification_match = 0
            """)
            incoherence_count = cur.fetchone()["cnt"]

            cur.execute("""
                SELECT AVG(coherence_score) as avg FROM calls WHERE coherence_score IS NOT NULL
            """)
            coherence_avg = round((cur.fetchone()["avg"] or 0), 1)

            cur.execute("""
                SELECT agent_name, COUNT(*) as cnt
                FROM calls WHERE qualification_match = 0
                GROUP BY agent_name
            """)
            incoherences_by_agent = [{"agent": r["agent_name"], "count": r["cnt"]} for r in cur.fetchall()]

            # Inactivity
            cur.execute("""
                SELECT COUNT(*) as cnt FROM calls WHERE inactivity_detected = 1
            """)
            inactivity_count = cur.fetchone()["cnt"]

            return {
                "refusals": refusals,
                "refusals_by_agent": refusals_by_agent,
                "incoherence_count": incoherence_count,
                "coherence_avg": coherence_avg,
                "incoherences_by_agent": incoherences_by_agent,
                "inactivity_count": inactivity_count,
            }
    finally:
        conn.close()


# ─── GEO ANALYSIS ────────────────────────────────────────────────────────────

@router.get("/geo")
async def geo_analysis(authorization: Optional[str] = Header(None)):
    """Geographic analysis by postal code / department."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    LEFT(postal_code, 2) as dept,
                    COUNT(*) as total,
                    AVG(score_percentage) as avg_score
                FROM calls
                WHERE postal_code IS NOT NULL AND postal_code != ''
                GROUP BY LEFT(postal_code, 2)
                ORDER BY total DESC
            """)
            departments = [
                {"dept": r["dept"], "total": r["total"], "avg_score": round(r["avg_score"] or 0, 1)}
                for r in cur.fetchall()
            ]

            total_geo = sum(d["total"] for d in departments)

            return {
                "departments": departments,
                "total_localized": total_geo,
                "dept_count": len(departments),
                "top_dept": departments[0]["dept"] if departments else "-",
            }
    finally:
        conn.close()


# ─── FOLLOWUPS ────────────────────────────────────────────────────────────────

@router.get("/followups")
async def followups_data(authorization: Optional[str] = Header(None)):
    """Follow-ups tracking data."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Check if followups table exists
            cur.execute("SHOW TABLES LIKE 'followups'")
            if not cur.fetchone():
                return {"stats": {}, "followups": [], "by_status": [], "by_agent": []}

            # Stats
            cur.execute("SELECT COUNT(*) as total FROM followups")
            total = cur.fetchone()["total"]

            cur.execute("SELECT status, COUNT(*) as cnt FROM followups GROUP BY status")
            status_data = {r["status"]: r["cnt"] for r in cur.fetchall()}

            convertis = status_data.get("converti", 0)
            taux = round((convertis / total * 100), 1) if total > 0 else 0

            # By status for chart
            status_labels = {
                "a_relancer": "À relancer",
                "relance_en_cours": "Relance en cours",
                "relance": "Relancé",
                "converti": "Converti",
                "injoignable": "Injoignable",
                "refus_final": "Refus final"
            }
            by_status = [
                {"status": status_labels.get(k, k), "count": v}
                for k, v in status_data.items()
            ]

            # By agent
            cur.execute("""
                SELECT agent_name, COUNT(*) as cnt
                FROM followups GROUP BY agent_name
            """)
            by_agent = [{"agent": r["agent_name"], "count": r["cnt"]} for r in cur.fetchall()]

            # Full list
            cur.execute("""
                SELECT agent_name, appointment_date, status, relance_count, updated_at
                FROM followups ORDER BY updated_at DESC LIMIT 100
            """)
            followups = cur.fetchall()

            return {
                "stats": {
                    "total": total,
                    "a_relancer": status_data.get("a_relancer", 0),
                    "relance_en_cours": status_data.get("relance_en_cours", 0),
                    "convertis": convertis,
                    "taux_conversion": taux,
                },
                "by_status": by_status,
                "by_agent": by_agent,
                "followups": followups,
            }
    finally:
        conn.close()


# ─── CALLS LOG (full detail for data table) ──────────────────────────────────

@router.get("/calls-log")
async def calls_log(
    authorization: Optional[str] = Header(None),
    limit: int = Query(200),
):
    """Full calls log for DataTable display."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT
                    id as call_id, agent_name, call_date,
                    sentiment, score_percentage, performance,
                    customer_intent, inactivity_detected, diarization_method,
                    refusal_reason, qualification_match, coherence_score
                FROM calls
                ORDER BY call_date DESC
                LIMIT %s
            """, (limit,))
            return cur.fetchall()
    finally:
        conn.close()


# ─── POINTAGE IA (Attendance) ────────────────────────────────────────────────

@router.get("/pointage")
async def get_pointage_data(authorization: Optional[str] = Header(None)):
    """Backend logic for Point 6 of specifications: Attendance detection."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    agent_name,
                    MIN(call_date) as first_call,
                    MAX(call_date) as last_call,
                    COUNT(*) as total_calls,
                    TIMESTAMPDIFF(MINUTE, MIN(call_date), MAX(call_date)) as duration_minutes
                FROM calls
                WHERE DATE(call_date) = CURDATE()
                GROUP BY agent_name
            """)
            
            rows = cur.fetchall()
            pointage = []
            
            for r in rows:
                first = r["first_call"]
                last = r["last_call"]
                
                # Check late arrival (if first call > 09:15)
                is_late = first.time() > datetime.strptime("09:15:00", "%H:%M:%S").time() if first else False
                
                # Check early departure (if last call < 17:45)
                is_early_exit = last.time() < datetime.strptime("17:45:00", "%H:%M:%S").time() if last else False
                
                pointage.append({
                    "agent": r["agent_name"],
                    "first_call": first.strftime("%H:%M:%S") if first else "--:--",
                    "last_call": last.strftime("%H:%M:%S") if last else "--:--",
                    "total_calls": r["total_calls"],
                    "productive_time": f"{r['duration_minutes'] // 60}h {r['duration_minutes'] % 60}m",
                    "status": "En retard" if is_late else "À l'heure",
                    "is_late": is_late,
                    "is_early_exit": is_early_exit
                })
                
            return pointage
    finally:
        conn.close()


@router.get("/live-agents")
async def live_agents_status(authorization: Optional[str] = Header(None)):
    """Live status of agents based on recent activity."""
    user = get_user(authorization)
    if user.get("role") not in ["admin", "qualite"]:
        raise HTTPException(status_code=403, detail="Admin or Quality access required")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # Get all agents from users table
            cur.execute("SELECT id, name, username FROM users WHERE role='agent'")
            users = cur.fetchall()

            live_data = []
            for u in users:
                # Last call for this agent
                cur.execute("""
                    SELECT MAX(call_date) as last_call, COUNT(*) as total
                    FROM calls WHERE agent_name = %s OR agent_name = %s
                """, (u["name"], u["username"]))
                call_info = cur.fetchone()
                
                status = "inactive"
                idle_time = 0
                calls = 0
                
                if call_info:
                    calls = call_info["total"] or 0
                    last_call = call_info["last_call"]
                    if last_call:
                        diff = (datetime.now() - last_call).total_seconds() / 60
                        if diff < 15:
                            status = "active"
                        elif diff < 60:
                            status = "break"
                        idle_time = int(diff)
                
                live_data.append({
                    "id": u["id"],
                    "name": u["name"],
                    "status": status,
                    "calls": calls,
                    "idleTime": idle_time,
                    "score": 75 # Mock score
                })
            
            return live_data
    finally:
        conn.close()

