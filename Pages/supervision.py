import streamlit as st
import pandas as pd
import plotly.express as px
from database import load_data
from automation import detect_alerts, send_email, generate_report
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


st.title(" Supervision & Monitoring")

# ================= LOAD DATA =================
data = load_data()

if data.empty:
    st.warning("Aucune donnée disponible")
    st.stop()

# ================= CLEAN DATA =================
data["call_time"] = pd.to_datetime(data["call_time"], errors="coerce")
data = data.dropna(subset=["call_time"])
data["hour"] = data["call_time"].dt.hour

# ================= GRAPH APPELS PAR HEURE =================
st.subheader(" Appels par heure")

calls_by_hour = data.groupby("hour").size().reset_index(name="calls")

fig = px.line(
    calls_by_hour,
    x="hour",
    y="calls",
    markers=True,
    title="Nombre d'appels par heure"
)

st.plotly_chart(fig, use_container_width=True)

st.divider()

# ================= ALERTES =================
st.subheader(" Alertes")

alerts = detect_alerts(data)

if alerts:
    for alert in alerts:
        st.warning(alert)
else:
    st.success("Aucune alerte détectée")

st.divider()

# ================= RAPPORT =================
st.subheader(" Génération de rapport")

if st.button(" Générer rapport"):
    report = generate_report(data)
    st.success("Rapport généré")
    st.write(report)

st.divider()

