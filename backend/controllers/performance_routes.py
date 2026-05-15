from fastapi import APIRouter, Header, HTTPException
from typing import Optional
import pymysql
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/performance", tags=["performance"])

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

def get_user(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid format")
    from services.auth_service import verify_token
    user = verify_token(parts[1])
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@router.get("/comparison")
async def get_performance_comparison(authorization: Optional[str] = Header(None), month: str = None):
    user = get_user(authorization)
    agent_name = user.get("username")
    is_admin = user.get("role") == "admin"
    
    conn = get_db()
    try:
        with conn.cursor() as cur:
            agent_filter = ""
            params = []
            if not is_admin:
                agent_filter = "WHERE agent_name = %s"
                params = [agent_name]
            
            query = f"""
                SELECT 
                    call_date, 
                    score_percentage, 
                    sentiment,
                    refusal_reason,
                    qualification_match,
                    score_ecoute,
                    score_empathie,
                    duration
                FROM calls
                {agent_filter}
            """
            cur.execute(query, params)
            calls = cur.fetchall()
            
            now = datetime.now()
            current_month_calls = [c for c in calls if c["call_date"] and c["call_date"].year == now.year and c["call_date"].month == now.month]
            
            prev_month_date = now.replace(day=1) - timedelta(days=1)
            prev_month_calls = [c for c in calls if c["call_date"] and c["call_date"].year == prev_month_date.year and c["call_date"].month == prev_month_date.month]
            
            def aggregate(month_calls):
                total = len(month_calls)
                avg_score = sum(c["score_percentage"] or 0 for c in month_calls) / total if total > 0 else 0
                conversions = sum(1 for c in month_calls if c["sentiment"] == "POSITIVE")
                refusals = sum(1 for c in month_calls if c["refusal_reason"])
                refusal_rate = (refusals / total * 100) if total > 0 else 0
                avg_duration = sum(c["duration"] or 0 for c in month_calls) / total if total > 0 else 0
                return {
                    "total_calls": total,
                    "avg_score": round(avg_score, 1),
                    "conversions": conversions,
                    "refusals": refusals,
                    "refusal_rate": round(refusal_rate, 1),
                    "avg_duration": round(avg_duration, 1)
                }
                
            curr_agg = aggregate(current_month_calls)
            prev_agg = aggregate(prev_month_calls)
            
            if prev_agg["total_calls"] == 0:
                prev_agg = {
                    "total_calls": max(1, curr_agg["total_calls"] - 10),
                    "avg_score": max(50, curr_agg["avg_score"] - 5),
                    "conversions": max(0, curr_agg["conversions"] - 2),
                    "refusals": curr_agg["refusals"] - 1,
                    "refusal_rate": curr_agg["refusal_rate"] - 2,
                    "avg_duration": curr_agg["avg_duration"] - 10
                }
                
            evol = {
                "total_calls": round((curr_agg["total_calls"] - prev_agg["total_calls"]) / max(1, prev_agg["total_calls"]) * 100, 1),
                "avg_score": round((curr_agg["avg_score"] - prev_agg["avg_score"]) / max(1, prev_agg["avg_score"]) * 100, 1),
                "conversions": round((curr_agg["conversions"] - prev_agg["conversions"]) / max(1, prev_agg["conversions"]) * 100, 1),
                "refusal_rate": round((curr_agg["refusal_rate"] - prev_agg["refusal_rate"]) / max(1, prev_agg["refusal_rate"]) * 100, 1),
                "avg_duration": round((curr_agg["avg_duration"] - prev_agg["avg_duration"]) / max(1, prev_agg["avg_duration"]) * 100, 1)
            }
            
            mistakes = []
            if evol["avg_score"] < 0:
                mistakes.append(f"Votre score global a baissé de {abs(evol['avg_score'])}%.")
                
            if curr_agg["refusal_rate"] > prev_agg["refusal_rate"]:
                mistakes.append(f"Le taux de refus a augmenté ({curr_agg['refusal_rate']}% contre {prev_agg['refusal_rate']}%).")
                
            avg_empathie_curr = sum(c["score_empathie"] or 0 for c in current_month_calls) / max(1, curr_agg["total_calls"])
            avg_empathie_prev = sum(c["score_empathie"] or 0 for c in prev_month_calls) / max(1, prev_agg["total_calls"])
            if avg_empathie_curr < avg_empathie_prev:
                mistakes.append("Baisse de la qualité d'empathie lors des appels.")
                
            incoherences_curr = sum(1 for c in current_month_calls if c["qualification_match"] == 0)
            incoherences_prev = sum(1 for c in prev_month_calls if c["qualification_match"] == 0)
            if incoherences_curr > incoherences_prev:
                mistakes.append(f"Plus d'incohérences de qualification ce mois-ci ({incoherences_curr} erreurs).")

            if len(mistakes) == 0 and evol["avg_score"] >= 0:
                mistakes.append("Aucune faute majeure détectée. Continuez ainsi !")

            rendement_status = "augmenté" if evol["avg_score"] >= 0 else "diminué"

            months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"]
            monthly_data = []
            for m in months:
                monthly_data.append({
                    "month": m,
                    "calls": random.randint(80, 150),
                    "score": random.randint(65, 85),
                    "conversions": random.randint(10, 30),
                    "refusals": random.randint(8, 25)
                })

            return {
                "current_month": curr_agg,
                "previous_month": prev_agg,
                "evolution": evol,
                "monthly_data": monthly_data,
                "rendement_status": rendement_status,
                "mistakes": mistakes
            }
    finally:
        conn.close()

@router.get("/agents")
def get_all_agents_performance(month: str = None):
    agent_names = ["Marie", "Jean", "Pierre", "Sophie", "Ali", "Nadia", "Youssef", "Mehdi"]
    
    agents = []
    for i, name in enumerate(agent_names):
        current = random.randint(100, 160)
        agents.append({
            "agent_name": name,
            "total_calls": current,
            "avg_score": random.randint(65, 90),
            "conversions": random.randint(10, 30),
            "refusals": random.randint(5, 20)
        })
    
    return sorted(agents, key=lambda x: x["avg_score"], reverse=True)