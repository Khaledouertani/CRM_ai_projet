import streamlit as st
import pandas as pd
import plotly.express as px
from models.database import load_data

st.title(" Analyse des Agents")
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







# ================= LOAD DATA =================
data = load_data()

if data.empty:
    st.warning("Aucune donnée disponible")
    st.stop()

# ================= CLEAN DATA =================
data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
data = data.dropna(subset=["call_time"])
data["hour"] = data["call_time"].dt.hour

# ================= FILTER =================
col1, col2 = st.columns(2)

agent_filter = col1.selectbox(
    "Agent",
    ["Tous"] + list(data["agent_name"].unique())
)

hour_filter = col2.slider("Heure", 0, 8, (0, 8))

df = data.copy()

if agent_filter != "Tous":
    df = df[df["agent_name"] == agent_filter]

df = df[
    (df["hour"] >= hour_filter[0]) &
    (df["hour"] <= hour_filter[1])
]

# ================= KPI =================
c1, c2, c3, c4 = st.columns(4)

c1.metric("Appels", len(df))
c2.metric("Score moyen", round(df["score_percentage"].mean(), 2))

c3.metric("Négatifs", len(df[df["sentiment"] == "NEGATIVE"]))

if not df.empty:
    top_agent = df.groupby("agent_name")["score_percentage"].mean().idxmax()
else:
    top_agent = "-"

c4.metric("Top agent", top_agent)

st.divider()

# ================= GRAPHIQUES =================
col1, col2 = st.columns(2)

# PIE SENTIMENT
fig1 = px.pie(
    df,
    names="sentiment",
    hole=0.4,
    title="Répartition des sentiments"
)

col1.plotly_chart(fig1, use_container_width=True)

# BAR PERFORMANCE
perf = df.groupby("agent_name")["score_percentage"].mean().reset_index()

fig2 = px.bar(
    perf,
    x="agent_name",
    y="score_percentage",
    title="Performance des agents",
    color="score_percentage"
)

col2.plotly_chart(fig2, use_container_width=True)

st.divider()

# ================= TABLE =================
st.subheader(" Données complètes des appels")

st.dataframe(df, use_container_width=True)