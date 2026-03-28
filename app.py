import streamlit as st
import pandas as pd
import smtplib
from database import load_data
from email.mime.text import MIMEText

# ================= STYLE =================
st.markdown("""
<style>
section[data-testid="stSidebar"] {
    background-color: #020617;
}
section[data-testid="stSidebar"] div {
    font-size: 18px;
    color: white;
}
</style>
""", unsafe_allow_html=True)

# ================= CONFIG =================
st.set_page_config(page_title="CRM IA", layout="wide")

# ================= DATA =================
data = load_data()

# ================= TITLE =================
st.markdown(
    """
    <h1 style='text-align: center; font-size: 50px; color: #2563eb;'>
          CRM IA - Agent Intelligent
    </h1>
    """,
    unsafe_allow_html=True
)

st.markdown(
    """
    <div style='text-align: center; font-size: 18px;'>
    Assistant intelligent pour analyser les appels et envoyer des emails 
    </div>
    """,
    unsafe_allow_html=True
)

st.divider()



def send_email(to_email, subject, message):
    try:
        server = smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525)
        server.starttls()

        email = "ea035d8b889b79"
        app_password = "13791d0250e493"

        server.login(email, app_password)

        # ✅ FIX UTF-8
        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = email
        msg["To"] = to_email

        server.send_message(msg)

        server.quit()

        return f" Email envoyé à {to_email}"

    except Exception as e:
        return f" Erreur: {e}"

# ================= TOOLS DATA =================
def get_best_agent():
    return data.groupby("agent_name")["score_percentage"].mean().idxmax()

def get_worst_agent():
    return data.groupby("agent_name")["score_percentage"].mean().idxmin()

def get_score():
    return round(data["score_percentage"].mean(), 2)

def get_negative_calls():
    return len(data[data["sentiment"] == "NEGATIVE"])

def get_total_calls():
    return len(data)

# ================= AGENT INTELLIGENT =================
def simple_agent(prompt):
    text = prompt.lower()

    #  EMAIL
    if "@" in text and "mail" in text:
        words = text.split()
        email = [w for w in words if "@" in w]

        if email:
            return send_email(email[0], "Suivi CRM", prompt)
        else:
            return " Email non détecté"

    #  DATA
    elif "meilleur" in text:
        return f" Meilleur agent : {get_best_agent()}"

    elif "pire" in text:
        return f" Pire agent : {get_worst_agent()}"

    elif "score" in text:
        return f" Score moyen : {get_score()}"

    elif "negatif" in text:
        return f" Appels négatifs : {get_negative_calls()}"

    elif "combien" in text or "total" in text:
        return f" Nombre total d'appels : {get_total_calls()}"

    #  réponses simples
    elif "bonjour" in text:
        return " Bonjour ! Comment puis-je t'aider ?"

    elif "merci" in text:
        return " Avec plaisir !"

    else:
        return " Pose une question sur les agents, scores ou envoie un email."

# ================= CHAT UI =================
st.subheader(" Chat IA")

if "chat" not in st.session_state:
    st.session_state.chat = []

for msg in st.session_state.chat:
    st.chat_message(msg["role"]).write(msg["content"])

user_input = st.chat_input("Pose ta question...")

if user_input:
    st.chat_message("user").write(user_input)
    st.session_state.chat.append({"role": "user", "content": user_input})

    reply = simple_agent(user_input)

    st.chat_message("assistant").write(reply)
    st.session_state.chat.append({"role": "assistant", "content": reply})