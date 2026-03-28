from models.database import load_data
from services.automation import send_email_mailtrap

# ================= TOOLS DATA =================
def get_best_agent(data):
    if data.empty:
        return "-"
    return data.groupby("agent_name")["score_percentage"].mean().idxmax()

def get_worst_agent(data):
    if data.empty:
        return "-"
    return data.groupby("agent_name")["score_percentage"].mean().idxmin()

def get_score(data):
    if data.empty:
        return 0
    return round(data["score_percentage"].mean(), 2)

def get_negative_calls(data):
    if data.empty:
        return 0
    return len(data[data["sentiment"] == "NEGATIVE"])

def get_total_calls(data):
    return len(data)

# ================= AGENT INTELLIGENT =================
def simple_agent(prompt: str) -> str:
    """ Processes user input and returns chatbot answer. """
    text = prompt.lower()
    
    # Reload data for up to date context
    data = load_data()

    # EMAIL
    if "@" in text and "mail" in text:
        words = text.split()
        email = [w for w in words if "@" in w]

        if email:
            return send_email_mailtrap(email[0], "Suivi CRM", prompt)
        else:
            return "Email non détecté"

    # DATA
    elif "meilleur" in text:
        return f"Meilleur agent : {get_best_agent(data)}"

    elif "pire" in text:
        return f"Pire agent : {get_worst_agent(data)}"

    elif "score" in text:
        return f"Score moyen : {get_score(data)}"

    elif "négatif" in text or "negatif" in text:
        return f"Appels négatifs : {get_negative_calls(data)}"

    elif "combien" in text or "total" in text:
        return f"Nombre total d'appels : {get_total_calls(data)}"

    # CONVERSATION
    elif "bonjour" in text:
        return "Bonjour ! Comment puis-je t'aider ?"

    elif "merci" in text:
        return "Avec plaisir !"

    else:
        return "Pose une question sur les agents, les scores ou envoie un email."
