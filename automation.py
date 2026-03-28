import smtplib
from datetime import datetime

# =========================
# EMAIL
# =========================
def send_email(to_email, subject, message):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        email = "khaledouertani00@gmail.com"
        app_password = "wyblxppbwnxdagwb"

        server.login(email, app_password)

        msg = f"Subject: {subject}\n\n{message}"
        server.sendmail(email, to_email, msg)

        server.quit()

        return " Email envoyé"

    except Exception as e:
        return f" Erreur: {e}"


# =========================
# ALERTES
# =========================
def detect_alerts(data):
    alerts = []

    for _, row in data.iterrows():

        # Client insatisfait
        if row.get("sentiment_score", 1) < 0.5:
            alerts.append(f" Client insatisfait (Call ID {row.get('call_id','?')})")

        # Agent faible performance
        if row.get("score_percentage", 100) < 50:
            alerts.append(f" Agent faible performance: {row.get('agent_name','')}")

    return alerts


# =========================
# RAPPORT
# =========================
def generate_report(data):

    if data.empty:
        return "Aucune donnée"

    report = data.groupby("agent_name").agg({
        "score_percentage": "mean",
        "call_id": "count"
    }).rename(columns={
        "score_percentage": "Score moyen",
        "call_id": "Nombre appels"
    })

    report["Date"] = datetime.now().strftime("%Y-%m-%d")

    return report


# =========================
# CLASSEMENT
# =========================
def ranking_agents(data):

    if data.empty:
        return "Aucune donnée"

    ranking = (
        data.groupby("agent_name")["score_percentage"]
        .mean()
        .sort_values(ascending=False)
    )

    return ranking