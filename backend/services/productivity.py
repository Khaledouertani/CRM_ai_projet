"""
services/productivity.py
====================
Service d'alertes productivité et détection d'agents non productifs.
"""

import pandas as pd
from datetime import datetime
from models.database import load_data


def get_inactivity_alerts() -> dict:
    """
    Analyse les données pour générer des alertes de productivité.
    
    Retourne:
        dict avec liste d'alertes et stats
    """
    try:
        data = load_data()
        if data.empty:
            return {"alerts": [], "stats": {}}
        
        data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
        data = data.dropna(subset=["call_time"])
        data["hour"] = data["call_time"].dt.hour
        
        alerts = []
        
        # 1. Détecter les inactivités
        if "inactivity_detected" in data.columns:
            inactifs = data[data["inactivity_detected"] == 1]
            if not inactifs.empty:
                for _, row in inactifs.iterrows():
                    duration = row.get("inactivity_duration", 0)
                    if duration and duration > 30:
                        alerts.append({
                            "type": "inactivity",
                            "severity": "warning",
                            "agent": row.get("agent_name", "Inconnu"),
                            "message": f"⚠️ Inactivité de {duration:.1f}s détectée",
                            "call_id": row.get("call_id"),
                            "duration": duration
                        })
        
        # 2. Détecter agents sans appel aujourd'hui
        today = datetime.now().date()
        data["call_date"] = data["call_time"].dt.date
        today_calls = data[data["call_date"] == today]
        
        all_agents = ["Ali", "Sana", "Omar", "Mariam", "Youssef"]
        agents_with_calls = today_calls["agent_name"].unique().tolist() if not today_calls.empty else []
        
        agents_inactive = [a for a in all_agents if a not in agents_with_calls]
        
        if agents_inactive:
            alerts.append({
                "type": "no_calls_today",
                "severity": "error",
                "agents": agents_inactive,
                "message": f"❌ Agents sans appel aujourd'hui: {', '.join(agents_inactive)}"
            })
        
        # 3. Détecter les scores faibles
        if "score_percentage" in data.columns:
            low_scores = data[data["score_percentage"] < 50]
            if not low_scores.empty:
                for _, row in low_scores.iterrows():
                    alerts.append({
                        "type": "low_score",
                        "severity": "error",
                        "agent": row.get("agent_name", "Inconnu"),
                        "message": f"🔴 Score faible: {row.get('score_percentage', 0)}%",
                        "call_id": row.get("call_id"),
                        "score": row.get("score_percentage", 0)
                    })
        
        # 4. Stats globales
        total_inact = len([a for a in alerts if a.get("type") == "inactivity"])
        
        stats = {
            "total_inactivity": total_inact,
            "agents_inactive_today": len(agents_inactive),
            "low_scores_count": len(low_scores) if "score_percentage" in data.columns else 0,
            "calls_today": len(today_calls),
            "avg_score_today": round(today_calls["score_percentage"].mean(), 1) if not today_calls.empty else 0
        }
        
        return {"alerts": alerts, "stats": stats}
        
    except Exception as e:
        print(f"Productivity alerts error: {e}")
        return {"alerts": [], "stats": {}}


def get_agent_performance_today() -> pd.DataFrame:
    """
    Retourne les performances des agents pour aujourd'hui.
    """
    try:
        data = load_data()
        if data.empty:
            return pd.DataFrame()
        
        data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
        data = data.dropna(subset=["call_time"])
        
        today = datetime.now().date()
        data["call_date"] = data["call_time"].dt.date
        today_data = data[data["call_date"] == today]
        
        if today_data.empty:
            return pd.DataFrame()
        
        perf = today_data.groupby("agent_name").agg({
            "call_id": "count",
            "score_percentage": "mean",
            "sentiment": lambda x: (x == "POSITIVE").sum()
        }).reset_index()
        
        perf.columns = ["Agent", "Appels", "Score_Moyen", "Appels_Positifs"]
        perf["Score_Moyen"] = perf["Score_Moyen"].round(1)
        
        return perf
        
    except Exception as e:
        print(f"Agent performance error: {e}")
        return pd.DataFrame()


def check_agent_idle_time(agent_name: str, last_call_time: datetime) -> dict:
    """
    Vérifie si un agent est inactif depuis un certain temps.
    À utiliser pour des vérifications en temps réel.
    """
    now = datetime.now()
    idle_seconds = (now - last_call_time).total_seconds()
    
    if idle_seconds > 300:  # 5 minutes
        return {
            "idle": True,
            "duration": idle_seconds,
            "message": f"⚠️ {agent_name} inactif depuis {idle_seconds/60:.1f} minutes"
        }
    
    return {"idle": False, "duration": idle_seconds}


def generate_productivity_report() -> str:
    """
    Génère un rapport textuel de productivité.
    """
    result = get_inactivity_alerts()
    perf = get_agent_performance_today()
    
    report = f"""
📊 RAPPORT DE PRODUCTIVITÉ
==========================
Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}

RÉSUMÉ DU JOUR:
----------------
• Appels aujourd'hui: {result['stats'].get('calls_today', 0)}
• Score moyen: {result['stats'].get('avg_score_today', 0)}%
• Agents inactifs: {result['stats'].get('agents_inactive_today', 0)}
• Inactivités détectées: {result['stats'].get('total_inactivity', 0)}
• Scores faibles: {result['stats'].get('low_scores_count', 0)}

PERFORMANCE PAR AGENT:
---------------------
"""
    
    if not perf.empty:
        for _, row in perf.iterrows():
            report += f"• {row['Agent']}: {row['Appels']} appels, Score: {row['Score_Moyen']}%\n"
    
    if result["alerts"]:
        report += "\n🚨 ALERTES:\n-------\n"
        for alert in result["alerts"]:
            report += f"• {alert['message']}\n"
    
    return report
