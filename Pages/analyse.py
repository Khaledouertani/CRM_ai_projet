import streamlit as st
import pandas as pd
from database import load_data
from automation import generate_report

st.title(" Analyse IA des appels")
import streamlit as st
from database import load_data


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

# ================= FILTRE AGENT =================
st.subheader(" Filtre")

agents = ["Tous"] + sorted(list(set(data["agent_name"].dropna())))
selected_agent = st.selectbox("Choisir agent", agents)

# appliquer filtre
if selected_agent != "Tous":
    filtered_data = data[data["agent_name"] == selected_agent]
else:
    filtered_data = data.copy()

# ================= TABLE =================
st.subheader(" Données")

st.dataframe(filtered_data, use_container_width=True)

st.divider()

# ================= INSIGHTS =================
st.subheader(" Insights automatiques")

total_calls = len(filtered_data)

avg_score = round(filtered_data["score_percentage"].mean(), 2) if not filtered_data.empty else 0
neg_calls = len(filtered_data[filtered_data["sentiment"] == "NEGATIVE"])

if not filtered_data.empty:
    best_agent = filtered_data.groupby("agent_name")["score_percentage"].mean().idxmax()
    worst_agent = filtered_data.groupby("agent_name")["score_percentage"].mean().idxmin()
else:
    best_agent = "-"
    worst_agent = "-"

st.success(f" Total appels : {total_calls}")
st.info(f" Score moyen : {avg_score}")
st.warning(f" Appels négatifs : {neg_calls}")
st.success(f" Meilleur agent : {best_agent}")
st.error(f" Agent le plus faible : {worst_agent}")

st.divider()

