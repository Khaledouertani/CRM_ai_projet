import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import streamlit as st
import pandas as pd
from models.database import load_data
from controllers.chatbot import simple_agent
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