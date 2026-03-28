import streamlit as st
import pandas as pd
import requests
import os
from models.database import insert_call, load_data
st.markdown("""
<style>
section[data-testid="stSidebar"] {
    background-color: #020617;
}

section[data-testid="stSidebar"] .css-1d391kg {
    padding-top: 20px;
}

section[data-testid="stSidebar"] div {
    font-size: 18px;
    color: white;
}

section[data-testid="stSidebar"] button {
    border-radius: 10px;
}
</style>
""", unsafe_allow_html=True)









# =========================
# TITRE
# =========================
st.title(" Ajouter un appel")

# =========================
# LOAD AGENTS (DYNAMIQUE)
# =========================
data = load_data()

if not data.empty and "agent_name" in data.columns:
    agents = sorted(list(set(data["agent_name"].dropna())))
else:
    agents = ["Agent_1", "Agent_2", "Agent_3"]

# =========================
# CHOIX AGENT
# =========================
agent_name = st.selectbox(
    " Choisir agent",
    agents
)

# =========================
# UPLOAD AUDIO
# =========================
audio = st.file_uploader(" Charger audio", type=["mp3", "wav"])

# =========================
# DATE + HEURE
# =========================
col1, col2 = st.columns(2)

call_date = col1.date_input(" Date appel")
call_time = col2.time_input(" Heure appel")

# =========================
# ANALYSE
# =========================
if audio:

    # sauvegarder audio
    os.makedirs("audio", exist_ok=True)
    path = f"audio/{audio.name}"

    with open(path, "wb") as f:
        f.write(audio.getbuffer())

    st.audio(path)

    # bouton analyse
    if st.button(" Lancer analyse IA"):

        with st.spinner("Analyse en cours..."):

            try:
                res = requests.post(
                    "http://127.0.0.1:8000/analyze_call",
                    params={"audio_path": path}
                )
                result = res.json()
            except:
                st.error(" API non disponible")
                st.stop()

        # =========================
        # AFFICHAGE RESULTATS
        # =========================
        st.subheader(" Résultat")

        st.write(" Transcription :")
        st.write(result.get("transcription", ""))

        st.write(" Sentiment :", result.get("sentiment", "N/A"))
        st.write(" Score :", round(result.get("score", 0), 2))

        # =========================
        # ENREGISTRER
        # =========================
        call_datetime = pd.Timestamp.combine(call_date, call_time)

        insert_call({
            "agent_name": agent_name,
            "audio_path": path,
            "transcription": result.get("transcription", ""),
            "sentiment": result.get("sentiment", ""),
            "sentiment_score": result.get("score", 0),
            "score_percentage": result.get("score", 0),
            "performance": "",
            "summary": result.get("transcription", "")[:100],
            "keywords": "",
            "call_type": "",
            "problem": "",
            "call_time": call_datetime.strftime("%Y-%m-%d %H:%M:%S")
        })

        st.success(" Appel enregistré avec succès")