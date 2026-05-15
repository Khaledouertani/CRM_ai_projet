"""
services/planning.py
===================
AI-powered team scheduling insights and recommendations.

Analyzes call data to provide:
- Peak productivity hours identification
- Agent performance by time slot
- Scheduling recommendations
"""

import pandas as pd
import requests
from datetime import datetime, timedelta
from models.database import load_data


def get_available_ollama_model():
    """Détecte automatiquement le meilleur modèle Ollama installé."""
    preferred_models = ["llama3.1", "gemma3:4b", "llama3", "gemma3", "mistral", "phi3"]
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=3)
        if response.status_code == 200:
            available = [m["name"] for m in response.json().get("models", [])]
            for preferred in preferred_models:
                for available_model in available:
                    if preferred in available_model.lower():
                        return available_model
            if available:
                return available[0]
    except Exception:
        pass
    return None


def analyze_peak_hours(data: pd.DataFrame) -> dict:
    """Analyse les heures de pointe de productivité."""
    if data.empty or "call_time" not in data.columns:
        return {
            "peak_hours": [],
            "low_hours": [],
            "avg_calls_per_hour": 0,
            "total_calls": 0
        }
    
    data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
    data = data.dropna(subset=["call_time"])
    data["hour"] = data["call_time"].dt.hour
    
    if data.empty:
        return {
            "peak_hours": [],
            "low_hours": [],
            "avg_calls_per_hour": 0,
            "total_calls": 0
        }
    
    hourly_stats = data.groupby("hour").agg({
        "call_id": "count",
        "score_percentage": "mean"
    }).reset_index()
    hourly_stats.columns = ["hour", "call_count", "avg_score"]
    
    total_calls = hourly_stats["call_count"].sum()
    avg_calls_per_hour = total_calls / 24 if total_calls > 0 else 0
    
    peak_threshold = avg_calls_per_hour * 1.3
    low_threshold = avg_calls_per_hour * 0.5
    
    peak_hours = hourly_stats[hourly_stats["call_count"] >= peak_threshold]["hour"].tolist()
    low_hours = hourly_stats[hourly_stats["call_count"] <= low_threshold]["hour"].tolist()
    
    return {
        "peak_hours": peak_hours,
        "low_hours": low_hours,
        "avg_calls_per_hour": round(avg_calls_per_hour, 1),
        "total_calls": int(total_calls),
        "hourly_breakdown": hourly_stats.to_dict("records")
    }


def analyze_agent_by_time(data: pd.DataFrame) -> dict:
    """Analyse la performance des agents par créneau horaire."""
    if data.empty or "call_time" not in data.columns:
        return {}
    
    data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
    data = data.dropna(subset=["call_time"])
    data["hour"] = data["call_time"].dt.hour
    
    time_slots = {
        "matin": (9, 12),
        "midi": (12, 14),
        "après-midi": (14, 18),
        "soir": (18, 20)
    }
    
    agent_performance = {}
    
    for agent in data["agent_name"].dropna().unique():
        agent_data = data[data["agent_name"] == agent]
        agent_perf = {"name": agent, "slots": {}}
        
        for slot_name, (start, end) in time_slots.items():
            slot_data = agent_data[(agent_data["hour"] >= start) & (agent_data["hour"] < end)]
            if not slot_data.empty:
                agent_perf["slots"][slot_name] = {
                    "calls": len(slot_data),
                    "avg_score": round(slot_data["score_percentage"].mean(), 1),
                    "success_rate": round(
                        len(slot_data[slot_data["performance"].isin(["Excellent", "Bon"])]) / 
                        len(slot_data) * 100, 1
                    ) if "performance" in slot_data.columns else 0
                }
        
        agent_perf["total_calls"] = len(agent_data)
        agent_perf["overall_avg_score"] = round(agent_data["score_percentage"].mean(), 1)
        
        agent_performance[agent] = agent_perf
    
    return agent_performance


def get_best_time_slots(data: pd.DataFrame) -> dict:
    """Identifie les meilleurs créneaux pour chaque type d'objectif."""
    if data.empty or "call_time" not in data.columns:
        return {}
    
    data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
    data = data.dropna(subset=["call_time"])
    data["hour"] = data["call_time"].dt.hour
    
    time_slots = {
        "Matin (9h-12h)": (9, 12),
        "Midi (12h-14h)": (12, 14),
        "Après-midi (14h-18h)": (14, 18),
        "Soir (18h-20h)": (18, 20)
    }
    
    results = {}
    
    for slot_name, (start, end) in time_slots.items():
        slot_data = data[(data["hour"] >= start) & (data["hour"] < end)]
        
        if slot_data.empty:
            results[slot_name] = {
                "calls": 0,
                "avg_score": 0,
                "conversion_rate": 0,
                "recommendation": "Données insuffisantes"
            }
            continue
        
        calls = len(slot_data)
        avg_score = round(slot_data["score_percentage"].mean(), 1)
        
        conversion_rate = 0
        
        rdv_data = slot_data[slot_data["customer_intent"].str.contains("RDV", na=False)]
        if not rdv_data.empty:
            conversion_rate = round(len(rdv_data) / calls * 100, 1)
        
        if avg_score >= 70 and conversion_rate >= 20:
            recommendation = "Excellent créneau pour les appels sortants"
        elif avg_score >= 60:
            recommendation = "Créneau correct, maintientz les objectifs"
        else:
            recommendation = "Créneau difficile, privilégiez la formation"
        
        results[slot_name] = {
            "calls": calls,
            "avg_score": avg_score,
            "conversion_rate": conversion_rate,
            "recommendation": recommendation
        }
    
    return results


def generate_planning_recommendations(data: pd.DataFrame) -> str:
    """Génère des recommandations textuelles basées sur l'analyse des données."""
    if data.empty:
        return "Aucune donnée disponible pour générer des recommandations."
    
    peak_analysis = analyze_peak_hours(data)
    agent_perf = analyze_agent_by_time(data)
    time_slots = get_best_time_slots(data)
    
    recommendations = []
    recommendations.append("=" * 60)
    recommendations.append("📅 RECOMMANDATIONS DE PLANIFICATION")
    recommendations.append("=" * 60)
    recommendations.append("")
    
    recommendations.append("🔹 HEURES DE POINTE:")
    if peak_analysis["peak_hours"]:
        peak_str = ", ".join([f"{h}h" for h in sorted(peak_analysis["peak_hours"])])
        recommendations.append(f"  • Pic d'activité: {peak_str}")
    if peak_analysis["low_hours"]:
        low_str = ", ".join([f"{h}h" for h in sorted(peak_analysis["low_hours"])])
        recommendations.append(f"  • Heures creuses: {low_str}")
    recommendations.append(f"  • Moyenne: {peak_analysis['avg_calls_per_hour']} appels/heure")
    recommendations.append("")
    
    recommendations.append("🔹 CRÉNEAUX RECOMMANDÉS:")
    for slot, info in time_slots.items():
        if info["calls"] > 0:
            recommendations.append(f"  • {slot}: {info['calls']} appels, score {info['avg_score']}%, conv. {info['conversion_rate']}%")
            recommendations.append(f"    → {info['recommendation']}")
    recommendations.append("")
    
    if agent_perf:
        recommendations.append("🔹 PERFORMANCE PAR AGENT:")
        for agent, perf in sorted(agent_perf.items(), key=lambda x: x[1].get("overall_avg_score", 0), reverse=True)[:5]:
            score = perf.get("overall_avg_score", 0)
            total = perf.get("total_calls", 0)
            best_slot = max(perf.get("slots", {}).items(), key=lambda x: x[1].get("avg_score", 0))
            recommendations.append(f"  • {agent}: {score}% avg ({total} appels)")
            if best_slot[0]:
                recommendations.append(f"    → Meilleur créneau: {best_slot[0]} ({best_slot[1].get('avg_score', 0)}%)")
        recommendations.append("")
    
    recommendations.append("🔹 ACTIONS RECOMMANDÉES:")
    if peak_analysis["peak_hours"]:
        recommendations.append("  1. Concentrer les agents performants pendant les heures de pointe")
    if peak_analysis["low_hours"]:
        recommendations.append("  2. Utiliser les heures creuses pour la formation ou le rattrapage")
    recommendations.append("  3. Suivre les performances en temps réel et ajuster les plannings")
    recommendations.append("")
    recommendations.append("=" * 60)
    
    return "\n".join(recommendations)


def generate_llm_recommendations(data: pd.DataFrame) -> str:
    """Génère des recommandations avancées via LLM Ollama."""
    if data.empty:
        return "Aucune donnée disponible pour l'analyse IA."
    
    peak_analysis = analyze_peak_hours(data)
    agent_perf = analyze_agent_by_time(data)
    time_slots = get_best_time_slots(data)
    
    summary = f"""
Données d'analyse:
- Total appels: {peak_analysis['total_calls']}
- Heures pointe: {peak_analysis['peak_hours']}
- Heures creuses: {peak_analysis['low_hours']}
- Moyenne/heure: {peak_analysis['avg_calls_per_hour']}

Performance par créneau:
"""
    for slot, info in time_slots.items():
        summary += f"- {slot}: {info['calls']} appels, score {info['avg_score']}%, conv {info['conversion_rate']}%\n"
    
    if agent_perf:
        summary += "\nTop agents:\n"
        for agent, perf in sorted(agent_perf.items(), key=lambda x: x[1].get("overall_avg_score", 0), reverse=True)[:3]:
            summary += f"- {agent}: {perf.get('overall_avg_score', 0)}% ({perf.get('total_calls', 0)} appels)\n"
    
    model_name = get_available_ollama_model()
    
    if not model_name:
        return generate_planning_recommendations(data)
    
    try:
        prompt = f"""Tu es un expert en planification de centre d'appels. Analyse ces données et fournis des recommandations précises pour optimiser la productivité de l'équipe.

{summary}

Fournis 5 recommandations actionnables pour améliorer la planification de l'équipe, en tenant compte des heures de pointe, des performances par agent et des créneaux les plus efficaces."""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json().get("response", "")
    except Exception as e:
        print(f"Erreur LLM planification: {e}")
    
    return generate_planning_recommendations(data)


def get_planning_insights(days: int = 30) -> dict:
    """Retourne les insights de planification pour les N derniers jours."""
    data = load_data()
    
    if data.empty:
        return {
            "status": "no_data",
            "message": "Aucune donnée disponible"
        }
    
    data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
    data = data.dropna(subset=["call_time"])
    
    if days > 0:
        cutoff_date = datetime.now() - timedelta(days=days)
        data = data[data["call_time"] >= cutoff_date]
    
    if data.empty:
        return {
            "status": "no_data",
            "message": f"Aucune donnée pour les {days} derniers jours"
        }
    
    return {
        "status": "success",
        "peak_hours": analyze_peak_hours(data),
        "agent_performance": analyze_agent_by_time(data),
        "time_slots": get_best_time_slots(data),
        "recommendations": generate_planning_recommendations(data),
        "llm_recommendations": generate_llm_recommendations(data)
    }
