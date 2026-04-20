"""
ui/app.py
=========
Point d'entrée Streamlit — Chatbot IA + KPIs + Login.

Modifications v2 :
  - Système de login (agent vs superviseur)
  - Supervision et Gestion bloquées aux superviseurs uniquement
  - Chatbot RAG intégré
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import streamlit as st
import pandas as pd
from langchain_core.messages import HumanMessage, AIMessage

from models.database import load_data
from ui.style import inject_custom_css, metric_card
from controllers.chatbot import ai_agent

# =============================================================================
# CONFIG PAGE
# =============================================================================

st.set_page_config(
    page_title="CRM IA - Centre d'Appels",
    layout="wide",
    
)
inject_custom_css()

# =============================================================================

# =============================================================================

# Comptes utilisateurs (en production → utiliser une vraie DB ou .env)
USERS = {
    "admin":      {"password": "admin123",  "role": "superviseur", "name": "Administrateur"},
    "superviseur":{"password": "super2024", "role": "superviseur", "name": "Superviseur"},
    "ali":        {"password": "agent123",  "role": "agent",       "name": "Ali"},
    "sana":       {"password": "agent123",  "role": "agent",       "name": "Sana"},
    "omar":       {"password": "agent123",  "role": "agent",       "name": "Omar"},
    "mariam":     {"password": "agent123",  "role": "agent",       "name": "Mariam"},
    "youssef":    {"password": "agent123",  "role": "agent",       "name": "Youssef"},
}

def show_login():
    """Affiche le formulaire de connexion centré."""
    st.markdown("""
    <div style='display:flex;justify-content:center;margin-top:80px;'>
        <div style='background:#15171a;border:1px solid #272a31;border-radius:16px;
                    padding:40px 48px;max-width:420px;width:100%;'>
            <div style='text-align:center;margin-bottom:32px;'>
                <div style='display:inline-flex;width:64px;height:64px;
                            background:linear-gradient(135deg,#1d4ed8,#7e22ce);
                            border-radius:16px;align-items:center;justify-content:center;
                            margin-bottom:16px;'>
                    <span style='font-size:28px;'></span>
                </div>
                <h2 style='color:white;margin:0;font-size:1.5rem;'>CRM IA</h2>
                <p style='color:#6b7280;margin:4px 0 0;font-size:14px;'>Centre d'appels intelligent</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1.2, 1])
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        username = st.text_input("Identifiant", placeholder="Votre identifiant", key="login_user")
        password = st.text_input("Mot de passe", type="password", placeholder="Votre mot de passe", key="login_pass")

        if st.button("Se connecter", type="primary", use_container_width=True):
            user_key = username.strip().lower()
            if user_key in USERS and USERS[user_key]["password"] == password.strip():
                st.session_state["logged_in"]   = True
                st.session_state["username"]    = user_key
                st.session_state["user_role"]   = USERS[user_key]["role"]
                st.session_state["user_name"]   = USERS[user_key]["name"]
                st.rerun()
            else:
                st.error("Identifiant ou mot de passe incorrect.")

        st.markdown("""
        <p style='text-align:center;color:#4b5563;font-size:12px;margin-top:16px;'>
            Agents : identifiant = prénom en minuscule, mot de passe = agent123
        </p>
        """, unsafe_allow_html=True)


def check_login():
    """Vérifie si l'utilisateur est connecté. Affiche le login sinon."""
    if not st.session_state.get("logged_in", False):
        show_login()
        st.stop()


def check_supervisor():
    """Bloque l'accès aux pages superviseur pour les agents."""
    if st.session_state.get("user_role") != "superviseur":
        st.error(" Accès réservé aux superviseurs.")
        st.stop()


# =============================================================================
# NAVIGATION
# =============================================================================

def show_navbar():
    """Barre de navigation commune à toutes les pages."""
    role = st.session_state.get("user_role", "agent")
    name = st.session_state.get("user_name", "")

    cols = st.columns([1, 1, 1, 3, 1])
    with cols[0]:
        st.page_link("app.py", label=" Accueil")
    with cols[1]:
        st.page_link("Pages/analytiques.py", label=" Analyse")
    with cols[2]:
        # Gestion visible seulement pour superviseurs
        if role == "superviseur":
            st.page_link("Pages/gestion.py", label=" Gestion")
    with cols[4]:
        if st.button(f" {name}", key="logout_btn"):
            for key in ["logged_in", "username", "user_role", "user_name", "messages"]:
                st.session_state.pop(key, None)
            st.rerun()

    st.divider()


# =============================================================================
# PAGE PRINCIPALE
# =============================================================================

# 1. Vérification login
check_login()

# 2. Navigation
show_navbar()

# 3. Sidebar
with st.sidebar:
    st.markdown(
        f'<div class="new-chat-btn"><span>+</span> &nbsp; Nouvelle conversation</div>',
        unsafe_allow_html=True
    )
    role_badge = " Superviseur" if st.session_state.get("user_role") == "superviseur" else " Agent"
    st.markdown(f"<small style='color:#6b7280;'>{role_badge} · {st.session_state.get('user_name','')}</small>", unsafe_allow_html=True)

# 4. Chargement données
data = load_data()
if not data.empty:
    data['score_percentage'] = pd.to_numeric(data['score_percentage'], errors='coerce').fillna(0)
    data['sentiment_score']  = pd.to_numeric(data['sentiment_score'],  errors='coerce').fillna(0)

# 5. Contenu principal
if not data.empty:
    st.markdown("<h1 style='text-align:center;'>CRM IA — Centre d'Appels</h1>", unsafe_allow_html=True)

    # KPI globaux
    total_calls = len(data)
    avg_score   = round(data["score_percentage"].mean(), 1)
    neg_calls   = len(data[data["sentiment"] == "NEGATIVE"])
    top_agent   = data.groupby("agent_name")["score_percentage"].mean().idxmax() \
                  if "agent_name" in data.columns and not data.empty else "-"

    c1, c2, c3, c4 = st.columns(4)
    with c1: metric_card("Total Appels",   total_calls)
    with c2: metric_card("Score Moyen",    f"{avg_score}%")
    with c3: metric_card("Appels Négatifs", neg_calls)
    with c4: metric_card("Top Agent",      top_agent)

    st.divider()

    # Chatbot IA
    st.subheader("Assistant IA")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        if isinstance(msg, HumanMessage):
            st.chat_message("user").write(msg.content)
        elif isinstance(msg, AIMessage):
            st.chat_message("assistant").write(msg.content)

    user_input = st.chat_input("Pose ta question sur les données CRM...")
    if user_input:
        with st.spinner("Analyse en cours..."):
            try:
                reply_text = ai_agent(user_input)
                st.session_state.messages.append(HumanMessage(content=user_input))
                st.session_state.messages.append(AIMessage(content=reply_text))
            except Exception as e:
                st.session_state.messages.append(HumanMessage(content=user_input))
                st.session_state.messages.append(AIMessage(content=f"Erreur: {e}"))
        st.rerun()

else:
    st.info("Aucune donnée disponible. Lance d'abord le watcher ou analyse un appel dans Gestion.")
