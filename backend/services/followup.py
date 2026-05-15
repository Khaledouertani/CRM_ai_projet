import random
from datetime import datetime, timedelta

def determine_followup(analysis: dict, scoring: dict) -> dict:
    """
    Détermine les actions de suivi recommandées après l'appel.
    """
    score = scoring.get("score_percentage", 0)
    sentiment = analysis.get("sentiment", "NEUTRAL")
    
    actions = []
    priority = "normal"
    
    if score < 60:
        actions.append("Formation recommandée sur les points faibles")
        priority = "high"
    
    if sentiment == "NEGATIVE":
        actions.append("Relancer avec offre spéciale")
        priority = "high"
    
    if score >= 80 and sentiment == "POSITIVE":
        actions.append("Proposer RDV de démonstration")
        priority = "low"
    
    return {
        "priority": priority,
        "actions": actions if actions else ["Suivi standard"],
        "next_contact": (datetime.now() + timedelta(days=1)).isoformat(),
        "notes": f"Score: {score}%, Sentiment: {sentiment}"
    }