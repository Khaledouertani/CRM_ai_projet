"""
ui/Pages/analytiques.py  (anciennement analyse.py)
====================================================
Dashboard analytique : Vue globale + Agents + Supervision + Géo-analyse.

Modifications v2 :
  - Export CSV/Excel sur chaque onglet
  - Graphique temps de parole agent/client (diarization)
  - Badge diarization method sur les appels
  - Alertes inactivité dans supervision
  - Carte géographique améliorée
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import io
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from models.database import load_data
from services.automation import detect_alerts, generate_report
from ui.style import inject_custom_css, metric_card, detail_card
from ui.app import show_navbar, check_login

inject_custom_css()
check_login()
show_navbar()

st.title(" Analyse Globale")

data = load_data()

if data.empty:
    st.warning("Aucune donnée disponible dans la base de données.")
    st.stop()

# Nettoyage commun
data["score_percentage"] = pd.to_numeric(data["score_percentage"], errors="coerce").fillna(0)
data["sentiment_score"]  = pd.to_numeric(data["sentiment_score"],  errors="coerce").fillna(0)
data["call_time"]        = pd.to_datetime(data["call_time"],       errors="coerce")
data = data.dropna(subset=["call_time"])
data["hour"] = data["call_time"].dt.hour

# =============================================================================
# HELPER : EXPORT
# =============================================================================

def export_buttons(df: pd.DataFrame, prefix: str):
    """Affiche les boutons d'export CSV et Excel."""
    col_csv, col_xlsx, _ = st.columns([1, 1, 4])

    with col_csv:
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            " CSV",
            csv_bytes,
            f"{prefix}.csv",
            "text/csv",
            key=f"dl_csv_{prefix}"
        )

    with col_xlsx:
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Data")
        st.download_button(
            " Excel",
            buf.getvalue(),
            f"{prefix}.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key=f"dl_xlsx_{prefix}"
        )


# =============================================================================
# TABS
# =============================================================================

tab1, tab2, tab3, tab4 = st.tabs([
    "  Vue Globale",
    "  Performance Agents",
    "  Supervision",
    "  Géo-Analyse"
])

# =============================================================================
# TAB 1 : VUE GLOBALE
# =============================================================================
with tab1:
    agents_list    = ["Tous"] + sorted(data["agent_name"].dropna().unique().tolist())
    selected_agent = st.selectbox("Filtrer par Agent", agents_list, key="global_agent")

    filtered = data[data["agent_name"] == selected_agent] \
               if selected_agent != "Tous" else data.copy()

    st.divider()

    total_calls  = len(filtered)
    avg_score    = round(filtered["score_percentage"].mean(), 1) if not filtered.empty else 0
    neg_calls    = len(filtered[filtered["sentiment"] == "NEGATIVE"])
    best_agent   = filtered.groupby("agent_name")["score_percentage"].mean().idxmax() \
                   if not filtered.empty else "-"
    worst_agent  = filtered.groupby("agent_name")["score_percentage"].mean().idxmin() \
                   if not filtered.empty else "-"

    c1, c2, c3 = st.columns(3)
    with c1: metric_card("Total Appels",        total_calls)
    with c2: metric_card("Score Moyen",         f"{avg_score}%")
    with c3: metric_card("Appels Négatifs",      neg_calls)

    c4, c5 = st.columns(2)
    with c4: metric_card("Meilleur Agent",       best_agent)
    with c5: metric_card("Priorité Formation",   worst_agent)

    st.divider()

    
    if not filtered.empty and all(c in filtered.columns for c in
            ["score_ecoute","score_persuasion","score_empathie",
             "score_argumentation","score_refus","score_vente"]):
        radar_data = filtered[[
            "score_ecoute","score_persuasion","score_empathie",
            "score_argumentation","score_refus","score_vente"
        ]].mean().reset_index()
        radar_data.columns = ["Critère","Score"]
        labels = {"score_ecoute":"Écoute","score_persuasion":"Persuasion",
                  "score_empathie":"Empathie","score_argumentation":"Argumentation",
                  "score_refus":"Refus","score_vente":"Vente"}
        radar_data["Critère"] = radar_data["Critère"].map(labels)

        fig_radar = go.Figure(go.Scatterpolar(
            r=radar_data["Score"].tolist(),
            theta=radar_data["Critère"].tolist(),
            fill="toself",
            line_color="#6366f1"
        ))
        fig_radar.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0,10])),
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            title="Scores moyens par critère",
            template="plotly_dark"
        )
        st.plotly_chart(fig_radar, use_container_width=True)

    st.subheader("Log des Données")
    cols_display = [c for c in [
        "call_id","agent_name","call_time","sentiment","score_percentage",
        "performance","customer_intent","inactivity_detected","diarization_method"
    ] if c in filtered.columns]
    st.dataframe(filtered[cols_display], use_container_width=True)

    st.divider()
    export_buttons(filtered, "analyse_globale")

# =============================================================================
# TAB 2 : PERFORMANCE AGENTS
# =============================================================================
with tab2:
    col1, col2 = st.columns(2)
    agent_filter = col1.selectbox("Agent", ["Tous"] + data["agent_name"].unique().tolist(), key="agent_tab")
    hour_filter  = col2.slider("Plage horaire", 0, 24, (0, 24))

    df_agent = data.copy()
    if agent_filter != "Tous":
        df_agent = df_agent[df_agent["agent_name"] == agent_filter]
    df_agent = df_agent[
        (df_agent["hour"] >= hour_filter[0]) &
        (df_agent["hour"] <= hour_filter[1])
    ]

    st.divider()

    c1, c2, c3, c4 = st.columns(4)
    with c1: metric_card("Total Appels",  len(df_agent))
    with c2:
        ms = round(df_agent["score_percentage"].mean(), 2) if not df_agent.empty else 0
        metric_card("Score Moyen",    f"{ms}%")
    with c3:
        metric_card("Défavorables",   len(df_agent[df_agent["sentiment"] == "NEGATIVE"]))
    with c4:
        top = df_agent.groupby("agent_name")["score_percentage"].mean().idxmax() \
              if not df_agent.empty else "-"
        metric_card("Top Agent", top)

    st.divider()

    col_a, col_b = st.columns(2)
    if not df_agent.empty:
        # Sentiment pie
        fig1 = px.pie(df_agent, names="sentiment", hole=0.4, title="Sentiments",
                      template="plotly_dark",
                      color_discrete_sequence=px.colors.qualitative.Pastel)
        fig1.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        col_a.plotly_chart(fig1, use_container_width=True)

        # Performance bar
        perf = df_agent.groupby("agent_name")["score_percentage"].mean().reset_index()
        fig2 = px.bar(perf, x="agent_name", y="score_percentage",
                      title="Performance par agent",
                      color="score_percentage", template="plotly_dark",
                      color_continuous_scale="Blues")
        fig2.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        col_b.plotly_chart(fig2, use_container_width=True)

    
    if not df_agent.empty and "agent_talk_ratio" in df_agent.columns:
        df_diar = df_agent[df_agent["agent_talk_ratio"] > 0]
        if not df_diar.empty:
            st.subheader("Temps de parole Agent vs Client")
            diar_avg = df_diar.groupby("agent_name")[
                ["agent_talk_ratio","client_talk_ratio"]
            ].mean().reset_index()
            diar_avg["Agent %"]  = (diar_avg["agent_talk_ratio"]  * 100).round(1)
            diar_avg["Client %"] = (diar_avg["client_talk_ratio"] * 100).round(1)

            fig_talk = go.Figure()
            fig_talk.add_trace(go.Bar(
                name="Agent",  x=diar_avg["agent_name"], y=diar_avg["Agent %"],
                marker_color="#22c55e"
            ))
            fig_talk.add_trace(go.Bar(
                name="Client", x=diar_avg["agent_name"], y=diar_avg["Client %"],
                marker_color="#6366f1"
            ))
            fig_talk.update_layout(
                barmode="stack", template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                yaxis_title="% du temps de l'appel"
            )
            st.plotly_chart(fig_talk, use_container_width=True)

    st.divider()
    cols_agent = [c for c in [
        "call_id","agent_name","call_time","sentiment","score_percentage",
        "customer_intent","agent_talk_ratio","client_talk_ratio","diarization_method"
    ] if c in df_agent.columns]
    st.dataframe(df_agent[cols_agent], use_container_width=True)
    st.divider()
    export_buttons(df_agent, "performance_agents")

# =============================================================================
# TAB 3 : SUPERVISION
# =============================================================================
with tab3:
    st.subheader("Trafic Horaire")

    calls_by_hour = data.groupby("hour").size().reset_index(name="Appels")
    fig3 = px.line(calls_by_hour, x="hour", y="Appels", markers=True,
                   title="Appels par heure", template="plotly_dark",
                   color_discrete_sequence=["#6366f1"])
    fig3.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig3, use_container_width=True)

    
    if "inactivity_detected" in data.columns:
        nb_inactif = data["inactivity_detected"].sum()
        if nb_inactif > 0:
            st.warning(f" {int(nb_inactif)} appel(s) avec inactivité > 30s détectée")
            df_inactif = data[data["inactivity_detected"] == 1][[
                "agent_name","call_time","inactivity_duration","score_percentage"
            ]]
            st.dataframe(df_inactif, use_container_width=True)

    st.divider()
    st.subheader("Alertes Automatiques")

    alerts = detect_alerts(data)
    if alerts:
        for alert in alerts:
            detail_card(" Alerte Active", alert)
    else:
        st.success(" Toutes les métriques sont nominales.")

    st.divider()
    st.subheader("Génération de Rapport")

    if st.button(" Compiler le Rapport", type="primary"):
        with st.spinner("Analyse en cours..."):
            report = generate_report(data)
            st.success("Rapport généré.")
            with st.expander("Voir le rapport"):
                st.write(report)

    st.divider()
    export_buttons(data, "supervision_complete")

# =============================================================================
# TAB 4 : GÉO-ANALYSE
# =============================================================================
with tab4:
    st.subheader(" Répartition Géographique")

    geo_df = data[
        data["postal_code"].astype(str).str.strip().str.len() > 0
    ].copy() if not data.empty else data.copy()

    if geo_df.empty:
        st.info("Aucun code postal détecté pour le moment.")
    else:
        geo_df["dep"] = geo_df["postal_code"].astype(str).str[:2]
        stats = geo_df.groupby("dep").agg(
            Nb_Appels=("call_id", "count"),
            Score_Moyen=("score_percentage", "mean")
        ).reset_index().sort_values("Nb_Appels", ascending=False)
        stats["Score_Moyen"] = stats["Score_Moyen"].round(1)

        c1, c2, c3 = st.columns(3)
        with c1: metric_card("Appels localisés", len(geo_df))
        with c2:
            best = stats.iloc[0]["dep"] if not stats.empty else "-"
            metric_card("Top Département", best)
        with c3: metric_card("Départements couverts", len(stats))

        
        fig_geo = px.bar(
            stats, x="dep", y="Nb_Appels", text="Nb_Appels",
            color="Score_Moyen", color_continuous_scale="Viridis",
            labels={"dep": "Département", "Nb_Appels": "Appels"},
            template="plotly_dark", title="Appels par département"
        )
        fig_geo.update_traces(textposition="outside")
        fig_geo.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_geo, use_container_width=True)

        st.subheader("Détails par code postal")
        cols_geo = [c for c in [
            "agent_name","postal_code","dep","sentiment","score_percentage","performance"
        ] if c in geo_df.columns]
        st.dataframe(geo_df[cols_geo], use_container_width=True)

        st.divider()
        export_buttons(geo_df[cols_geo], "geo_analyse")
