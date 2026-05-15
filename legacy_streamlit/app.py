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
    """Affiche le formulaire de connexion SaaS moderne."""
    from ui.style import ai_logo_html
    
    st.markdown("<div style='margin-top: 40px;'></div>", unsafe_allow_html=True)
    
    # Logo et Titre
    st.markdown(ai_logo_html(), unsafe_allow_html=True)
    st.markdown("<h2 style='text-align:center;margin-bottom:0;'>Bienvenue sur CRM IA</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align:center;color:var(--text-tertiary);margin-bottom:40px;'>Identifiez-vous pour accéder à votre tableau de bord</p>", unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        with st.container():
            st.markdown("""
            <div style='background:var(--bg-secondary);padding:32px;border-radius:20px;border:1px solid var(--border-subtle);box-shadow:var(--shadow-lg);'>
            """, unsafe_allow_html=True)
            
            username = st.text_input("Identifiant", placeholder="Entrez votre identifiant")
            password = st.text_input("Mot de passe", type="password", placeholder="••••••••")
            
            st.markdown("<div style='margin-top:20px;'></div>", unsafe_allow_html=True)
            
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
            
            st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("""
        <p style='text-align:center;color:var(--text-tertiary);font-size:12px;margin-top:24px;'>
            Version 2.0 · Sécurisé par IA Native
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
    st.markdown('''
    <div class="new-chat-btn">
        <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/></svg>
        Nouvelle conversation
    </div>
    ''', unsafe_allow_html=True)
    role_badge = " Superviseur" if st.session_state.get("user_role") == "superviseur" else " Agent"
    st.markdown(f"<small style='color:#6b7280;'>{role_badge} · {st.session_state.get('user_name','')}</small>", unsafe_allow_html=True)

# 4. Chargement données
data = load_data()
if not data.empty:
    data['score_percentage'] = pd.to_numeric(data['score_percentage'], errors='coerce').fillna(0)
    data['sentiment_score']  = pd.to_numeric(data['sentiment_score'],  errors='coerce').fillna(0)

    user_role = st.session_state.get("user_role", "agent")
    user_name = st.session_state.get("user_name", "")
    if user_role == "agent" and user_name:
        data = data[data["agent_name"] == user_name]

# 5. Contenu principal
if not data.empty:
    user_role = st.session_state.get("user_role", "")
    if user_role == "superviseur":
        st.markdown("<h1>CRM IA — Centre d'Appels</h1>", unsafe_allow_html=True)
    else:
        st.markdown("<h1>CRM IA — Mes performances</h1>", unsafe_allow_html=True)

    total_calls = len(data)
    avg_score   = round(data["score_percentage"].mean(), 1) if not data.empty else 0
    neg_calls   = len(data[data["sentiment"] == "NEGATIVE"]) if not data.empty else 0
    if user_role == "superviseur":
        top_agent = data.groupby("agent_name")["score_percentage"].mean().idxmax() \
                    if "agent_name" in data.columns and not data.empty else "-"
    else:
        top_agent = "-"

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
                agent_name = None
                if st.session_state.get("user_role") == "agent":
                    agent_name = st.session_state.get("user_name")
                reply_text = ai_agent(user_input, agent_name)
                st.session_state.messages.append(HumanMessage(content=user_input))
                st.session_state.messages.append(AIMessage(content=reply_text))
            except Exception as e:
                st.session_state.messages.append(HumanMessage(content=user_input))
                st.session_state.messages.append(AIMessage(content=f"Erreur: {e}"))
        st.rerun()

else:
    st.info("Aucune donnée disponible. Lance d'abord le watcher ou analyse un appel dans Gestion.")
