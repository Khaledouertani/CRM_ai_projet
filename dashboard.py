import streamlit as st
import pandas as pd
import os
import plotly.express as px
from ai_utils import transcribe_audio, analyze_sentiment, agent_score

st.set_page_config(page_title="CRM IA Dashboard", layout="wide")

# =========================
# SIDEBAR NAVIGATION
# =========================

st.sidebar.title(" CRM IA")

page = st.sidebar.radio(
    "Navigation",
    ["Dashboard", "Analyse IA", "Agents", "Supervision"]
)

# =========================
# LOAD DATA
# =========================

try:
    data = pd.read_csv("calls_db.csv", encoding="utf-8-sig")
except:
    st.error("Le fichier calls_db.csv est introuvable.")
    st.stop()

# créer call_time si la colonne n'existe pas
if "call_time" not in data.columns:
    data["call_time"] = pd.Timestamp.now()

# =========================
# PAGE DASHBOARD
# =========================

if page == "Dashboard":

    st.title(" CRM IA - Analyse des appels")

    # =========================
    # ASSISTANT CRM IA
    # =========================

    st.subheader(" Assistant CRM IA")

    question = st.text_input(
        "Posez une question (ex: meilleur agent, appels négatifs, score moyen)"
    )

    if question:

        q = question.lower()

        if "meilleur" in q:

            best_agent = (
                data.groupby("agent_name")["score_percentage"]
                .mean()
                .idxmax()
            )

            st.success(f" L'agent le plus performant est : {best_agent}")

        elif "négatif" in q or "negatif" in q:

            negative_calls = data[data["sentiment"] == "NEGATIVE"]

            st.warning(f" Nombre d'appels négatifs : {len(negative_calls)}")

        elif "combien" in q or "total" in q:

            st.info(f" Total appels analysés : {len(data)}")

        elif "score" in q:

            avg_score = data["score_percentage"].mean()

            st.info(f" Score moyen des agents : {round(avg_score,2)}")

        elif "plus appels" in q:

            top_agent = data["agent_name"].value_counts().idxmax()

            st.success(f" L'agent avec le plus d'appels est : {top_agent}")

        else:

            st.write(" Question non reconnue.")
            st.write("Essayez par exemple :")
            st.write("- meilleur agent")
            st.write("- appels négatifs")
            st.write("- score moyen")
            st.write("- combien d'appels")

    st.divider()

    # =========================
    # CHOISIR AGENT
    # =========================

    st.subheader(" Choisir l'agent")

    agents = data["agent_name"].dropna().unique()

    selected_agent = st.selectbox("Sélectionner un agent", agents)

    st.divider()

    # =========================
    # LAYOUT PRINCIPAL
    # =========================

    col1, col2 = st.columns([2,1])

    # =========================
    # PARTIE AUDIO
    # =========================

    with col1:

        st.subheader("🎧 Ajouter un appel audio")

        uploaded_audio = st.file_uploader(
            "Importer un audio",
            type=["mp3","wav","mpeg"]
        )

        if uploaded_audio:

            os.makedirs("audio", exist_ok=True)

            audio_path = os.path.join("audio", uploaded_audio.name)

            with open(audio_path,"wb") as f:
                f.write(uploaded_audio.getbuffer())

            st.audio(audio_path)

            with st.spinner("Analyse IA en cours..."):

                transcription = transcribe_audio(audio_path)

                sentiment, sentiment_score = analyze_sentiment(transcription)

                score, performance = agent_score(sentiment_score)

            resume = transcription[:200] + "..."

            st.subheader(" Résultat IA")

            m1, m2, m3 = st.columns(3)

            m1.metric("Sentiment", sentiment)
            m2.metric("Score agent", round(score,2))
            m3.metric("Performance", performance)

            st.subheader(" Transcription")
            st.write(transcription)

            st.subheader(" Résumé")
            st.write(resume)

            if sentiment == "NEGATIVE":
                st.error(" Appel problématique détecté")

            new_call = {
                "call_id": len(data)+1,
                "agent_name": selected_agent,
                "audio_path": audio_path,
                "transcription": transcription,
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "score_percentage": score,
                "performance": performance,
                "summary": resume,
                "call_time": pd.Timestamp.now()
            }

            data = pd.concat([data, pd.DataFrame([new_call])], ignore_index=True)

            data.to_csv("calls_db.csv", index=False)

    # =========================
    # HEURE APPEL
    # =========================

    with col2:

        st.subheader("⏱ Heure de l'appel")

        call_hour = st.number_input("Heure",0,23)
        call_minute = st.number_input("Minute",0,59)

        st.info(f"Heure saisie : {call_hour}:{call_minute}")

# =========================
# PAGE ANALYSE IA
# =========================

elif page == "Analyse IA":

    st.title(" Analyse IA des appels")

    data["call_time"] = pd.to_datetime(data["call_time"], format="mixed")

    st.subheader(" Choisir agent")

    agents = data["agent_name"].dropna().unique()

    selected_agent = st.selectbox("Sélectionner agent", agents)

    agent_data = data[data["agent_name"] == selected_agent]

    st.divider()

    st.subheader(" Historique des appels")

    st.dataframe(
        agent_data[[
            "audio_path",
            "transcription",
            "sentiment",
            "score_percentage",
            "call_time"
        ]],
        use_container_width=True
    )

    st.divider()

    st.subheader(" Durée entre appels")

    agent_sorted = agent_data.sort_values("call_time")

    agent_sorted["previous_call"] = agent_sorted["call_time"].shift(1)

    agent_sorted["duration_between_calls"] = (
        agent_sorted["call_time"] - agent_sorted["previous_call"]
    )

    agent_sorted["duration_minutes"] = (
        agent_sorted["duration_between_calls"].dt.total_seconds()/60
    )

    st.dataframe(
        agent_sorted[["call_time","duration_minutes"]],
        use_container_width=True
    )

    st.divider()

    st.subheader(" Pointage agent")

    premier = agent_data["call_time"].min()
    dernier = agent_data["call_time"].max()
    nombre = len(agent_data)

    p1,p2,p3 = st.columns(3)

    p1.metric("Premier appel", premier.strftime("%H:%M"))
    p2.metric("Dernier appel", dernier.strftime("%H:%M"))
    p3.metric("Nombre appels", nombre)

    st.divider()

    st.subheader("🚨 Alertes")

    if nombre < 10:
        st.error(f"🚨 {selected_agent} a moins de 10 appels")

    pauses = agent_sorted[agent_sorted["duration_minutes"] > 30]

    for _,row in pauses.iterrows():

        st.warning(
            f"⚠️ Pause longue détectée : {row['duration_minutes']:.1f} minutes"
        )

# =========================
# PAGE AGENTS
# =========================

elif page == "Agents":

    st.title(" Classement des agents")

    agent_perf = (
        data.groupby("agent_name")["score_percentage"]
        .mean()
        .reset_index()
    )

    fig = px.bar(
        agent_perf,
        x="agent_name",
        y="score_percentage",
        color="agent_name",
        title="Performance des agents"
    )

    st.plotly_chart(fig)

    st.dataframe(agent_perf)

# =========================
# PAGE SUPERVISION
# =========================

elif page == "Supervision":

    st.title(" Supervision centre d'appel")

    data["call_time"] = pd.to_datetime(data["call_time"], format="mixed")

    data["hour"] = data["call_time"].dt.hour

    calls_hour = data.groupby("hour").size().reset_index(name="calls")

    fig = px.line(
        calls_hour,
        x="hour",
        y="calls",
        title="Appels par heure"
    )

    st.plotly_chart(fig)

    last_calls = data.groupby("agent_name")["call_time"].max()

    now = pd.Timestamp.now()

    inactivity = now - last_calls

    st.subheader("Statut agents")

    for agent,idle in inactivity.items():

        if idle.total_seconds() > 300:

            st.error(f" {agent} inactif")

        else:

            st.success(f" {agent} actif")
st.subheader(" Timeline des appels des agents")

timeline_data = data.copy()

timeline_data["call_time"] = pd.to_datetime(timeline_data["call_time"], format="mixed")

timeline_data["end_time"] = timeline_data["call_time"] + pd.Timedelta(minutes=5)

fig = px.timeline(
    timeline_data,
    x_start="call_time",
    x_end="end_time",
    y="agent_name",
    color="agent_name",
    title="Activité des agents"
)

fig.update_yaxes(autorange="reversed")

st.plotly_chart(fig, use_container_width=True)