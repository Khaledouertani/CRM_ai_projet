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
from services.followup import get_followups, get_followup_stats
from services.productivity import get_inactivity_alerts, get_agent_performance_today
from services.planning import get_planning_insights
from ui.style import inject_custom_css, metric_card, detail_card, COLORS
from ui.app import show_navbar, check_login

inject_custom_css()
check_login()
show_navbar()

user_role = st.session_state.get("user_role", "agent")
user_name = st.session_state.get("user_name", "")

if user_role == "superviseur":
    st.title(" Analyse Globale")
else:
    st.title(" Mes Statistiques")

data = load_data()

if user_role == "agent" and user_name:
    data = data[data["agent_name"] == user_name]

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

if user_role == "superviseur":
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "  Vue Globale",
        "  Performance Agents",
        "  Supervision",
        "  Géo-Analyse",
        "  Suivi Prospects",
        "  Planification IA"
    ])
else:
    tab1 = st.tabs(["  Mes Statistiques"])[0]

# =============================================================================
# TAB 1 : VUE GLOBALE (or Mes Statistiques for agents)
# =============================================================================
with tab1:
    if user_role == "superviseur":
        agents_list    = ["Tous"] + sorted(data["agent_name"].dropna().unique().tolist())
        selected_agent = st.selectbox("Filtrer par Agent", agents_list, key="global_agent")

        filtered = data[data["agent_name"] == selected_agent] \
                   if selected_agent != "Tous" else data.copy()
    else:
        filtered = data.copy()

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
            line_color=COLORS["accent"],
            fillcolor="rgba(139, 92, 246, 0.2)"
        ))
        fig_radar.update_layout(
            polar=dict(
                radialaxis=dict(visible=True, range=[0,10], 
                              color=COLORS["text_tertiary"],
                              gridcolor="rgba(255,255,255,0.05)"),
                bgcolor="rgba(0,0,0,0)",
                angularaxis=dict(color=COLORS["text_secondary"])
            ),
            paper_bgcolor="rgba(0,0,0,0)", 
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(t=40, b=40, l=40, r=40),
            title=dict(text="Scores moyens par critère", font=dict(color=COLORS["text_primary"], size=18, family="Inter")),
            font=dict(color=COLORS["text_secondary"], family="Inter")
        )
        st.plotly_chart(fig_radar, use_container_width=True)

    st.markdown("### Log des Données")
    cols_display = [c for c in [
        "call_id","agent_name","call_time","sentiment","score_percentage",
        "performance","customer_intent","inactivity_detected","diarization_method"
    ] if c in filtered.columns]
    st.dataframe(filtered[cols_display], use_container_width=True)

    st.divider()
    export_buttons(filtered, "analyse_globale")

# =============================================================================
# TAB 2 : PERFORMANCE AGENTS (Supervisors only)
# =============================================================================
if user_role == "superviseur":
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
            fig1 = px.pie(df_agent, names="sentiment", hole=0.6, title="Répartition des Sentiments",
                          color_discrete_sequence=[COLORS["success"], COLORS["error"], COLORS["warning"], COLORS["info"]])
            fig1.update_traces(textinfo='percent+label', pull=[0.05, 0, 0, 0])
            fig1.update_layout(
                paper_bgcolor="rgba(0,0,0,0)", 
                plot_bgcolor="rgba(0,0,0,0)",
                showlegend=False,
                title=dict(font=dict(color=COLORS["text_primary"], size=18, family="Inter")),
            )
            col_a.plotly_chart(fig1, use_container_width=True)

            perf = df_agent.groupby("agent_name")["score_percentage"].mean().reset_index()
            fig2 = px.bar(perf, x="agent_name", y="score_percentage",
                          title="Performance Moyenne",
                          color="score_percentage", 
                          color_continuous_scale=[COLORS["accent_hover"], COLORS["accent"]])
            fig2.update_traces(marker=dict(line=dict(width=0), borderwidth=0), width=0.5)
            fig2.update_layout(
                paper_bgcolor="rgba(0,0,0,0)", 
                plot_bgcolor="rgba(0,0,0,0)",
                title=dict(font=dict(color=COLORS["text_primary"], size=18, family="Inter")),
                xaxis=dict(color=COLORS["text_secondary"], gridcolor="rgba(255,255,255,0.05)"),
                yaxis=dict(color=COLORS["text_secondary"], gridcolor="rgba(255,255,255,0.05)"),
                coloraxis_showscale=False
            )
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
                    marker_color=COLORS["success"]
                ))
                fig_talk.add_trace(go.Bar(
                    name="Client", x=diar_avg["agent_name"], y=diar_avg["Client %"],
                    marker_color=COLORS["info"]
                ))
                fig_talk.update_layout(
                    barmode="stack",
                    paper_bgcolor=COLORS["bg_secondary"], 
                    plot_bgcolor=COLORS["bg_secondary"],
                    title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                    xaxis=dict(color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                    yaxis=dict(title="% du temps de l'appel", color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                    legend=dict(font=dict(color=COLORS["text_secondary"]))
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
# TAB 3 : SUPERVISION (Supervisors only)
# =============================================================================
if user_role == "superviseur":
    with tab3:
        st.subheader("Trafic Horaire")

        calls_by_hour = data.groupby("hour").size().reset_index(name="Appels")
        fig3 = px.line(calls_by_hour, x="hour", y="Appels", markers=True,
                       title="Appels par heure",
                       color_discrete_sequence=[COLORS["accent"]])
        fig3.update_traces(line=dict(width=2), marker=dict(size=8))
        fig3.update_layout(
            paper_bgcolor=COLORS["bg_secondary"], 
            plot_bgcolor=COLORS["bg_secondary"],
            title=dict(font=dict(color=COLORS["text_primary"], size=16)),
            xaxis=dict(title="Heure", color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
            yaxis=dict(title="Appels", color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
            legend=dict(font=dict(color=COLORS["text_secondary"]))
        )
        st.plotly_chart(fig3, use_container_width=True)

        st.divider()
        st.subheader("Alertes Productivité")
        
        prod_result = get_inactivity_alerts()
        prod_stats = prod_result.get("stats", {})
        
        c_p1, c_p2, c_p3, c_p4 = st.columns(4)
        with c_p1: metric_card("Appels Aujourd'hui", prod_stats.get("calls_today", 0))
        with c_p2: metric_card("Score Moyen", f"{prod_stats.get('avg_score_today', 0)}%")
        with c_p3: metric_card("Agents Inactifs", prod_stats.get("agents_inactive_today", 0))
        with c_p4: metric_card("Inactivités", prod_stats.get("total_inactivity", 0))
        
        # Performance aujourd'hui par agent
        perf_today = get_agent_performance_today()
        if not perf_today.empty:
            st.subheader("Performance du Jour")
            
            fig_perf = px.bar(
                perf_today,
                x="Agent",
                y="Appels",
                title="Appels par agent aujourd'hui",
                color="Score_Moyen",
                color_continuous_scale=[COLORS["error"], COLORS["warning"], COLORS["success"]]
            )
            fig_perf.update_layout(
                paper_bgcolor=COLORS["bg_secondary"],
                plot_bgcolor=COLORS["bg_secondary"],
            )
            st.plotly_chart(fig_perf, use_container_width=True)
        
        # Afficher les alertes
        if prod_result.get("alerts"):
            st.subheader("🚨 Alertes en Cours")
            
            for alert in prod_result["alerts"]:
                if alert["severity"] == "error":
                    st.error(alert["message"])
                elif alert["severity"] == "warning":
                    st.warning(alert["message"])
                else:
                    st.info(alert["message"])

        
        if "inactivity_detected" in data.columns:
            nb_inactif = data["inactivity_detected"].sum()
            if nb_inactif > 0:
                st.warning(f" {int(nb_inactif)} appel(s) avec inactivité > 30s détectée")
                df_inactif = data[data["inactivity_detected"] == 1][
                    ["agent_name","call_time","inactivity_duration","score_percentage"]
                ]
                st.dataframe(df_inactif, use_container_width=True)

        st.divider()
        
        # Analyse des motifs de refus
        if "refusal_reason" in data.columns:
            refus_data = data[data["refusal_reason"].astype(str).str.strip() != ""]
            if not refus_data.empty:
                st.subheader("Motifs de Refus")
                
                col_r1, col_r2 = st.columns(2)
                
                with col_r1:
                    refus_counts = refus_data["refusal_reason"].value_counts().reset_index()
                    refus_counts.columns = ["Motif", "Nombre"]
                    
                    refus_labels = {
                        "prix_trop_eleve": "Prix trop élevé",
                        "pas_besoin": "Pas besoin",
                        "pas_decision": "Pas de décision",
                        "concurrence": "Favorise concurrence",
                        "deja_client": "Déjà client ailleurs",
                        "timing_mauvais": "Mauvais moment",
                        "autre": "Autre"
                    }
                    refus_counts["Motif"] = refus_counts["Motif"].map(
                        lambda x: refus_labels.get(x, x)
                    )
                    
                    fig_refus = px.bar(
                        refus_counts,
                        x="Motif",
                        y="Nombre",
                        title="Répartition des motifs de refus",
                        color_discrete_sequence=[COLORS["error"]]
                    )
                    fig_refus.update_traces(marker=dict(line=dict(width=0)))
                    fig_refus.update_layout(
                        paper_bgcolor=COLORS["bg_secondary"], 
                        plot_bgcolor=COLORS["bg_secondary"],
                        title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                        xaxis=dict(color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                        yaxis=dict(color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                    )
                    st.plotly_chart(fig_refus, use_container_width=True)
                
                with col_r2:
                    refus_by_agent = refus_data.groupby("agent_name")["refusal_reason"].count().reset_index()
                    refus_by_agent.columns = ["Agent", "Nombre de refus"]
                    
                    fig_refus_agent = px.bar(
                        refus_by_agent,
                        x="Agent",
                        y="Nombre de refus",
                        title="Refus par agent",
                        color_discrete_sequence=[COLORS["warning"]]
                    )
                    fig_refus_agent.update_traces(marker=dict(line=dict(width=0)))
                    fig_refus_agent.update_layout(
                        paper_bgcolor=COLORS["bg_secondary"], 
                        plot_bgcolor=COLORS["bg_secondary"],
                        title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                        xaxis=dict(color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                        yaxis=dict(color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                    )
                    st.plotly_chart(fig_refus_agent, use_container_width=True)
                
                with st.expander("Voir détails des refus"):
                    st.dataframe(
                        refus_data[["agent_name", "call_time", "sentiment", "refusal_reason", "score_percentage"]],
                        use_container_width=True
                    )
            else:
                st.info("Aucun motif de refus détecté.")

        st.divider()
        st.subheader("Alertes Automatiques")

        alerts = detect_alerts(data)
        if alerts:
            for alert in alerts:
                detail_card(" Alerte Active", alert)
        else:
            st.success(" Toutes les métriques sont nominales.")

        st.divider()
        
        # Analyse cohérence qualification
        if "qualification_match" in data.columns:
            incoherence_count = len(data[data["qualification_match"] == 0])
            if incoherence_count > 0:
                st.subheader("Incohérences de Qualification")
                
                col_c1, col_c2 = st.columns(2)
                
                with col_c1:
                    incoherence_data = data[data["qualification_match"] == 0]
                    
                    incoherence_by_agent = incoherence_data.groupby("agent_name").size().reset_index()
                    incoherence_by_agent.columns = ["Agent", "Nombre"]
                    
                    fig_incoh = px.bar(
                        incoherence_by_agent,
                        x="Agent",
                        y="Nombre",
                        title="Incohérences par agent",
                        color_discrete_sequence=[COLORS["warning"]]
                    )
                    fig_incoh.update_layout(
                        paper_bgcolor=COLORS["bg_secondary"], 
                        plot_bgcolor=COLORS["bg_secondary"],
                        title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                    )
                    st.plotly_chart(fig_incoh, use_container_width=True)
                
                with col_c2:
                    coherence_moyenne = round(data["coherence_score"].mean(), 1)
                    avg_score = round(data["score_percentage"].mean(), 1)
                    
                    fig_coherence = go.Figure()
                    fig_coherence.add_trace(go.Indicator(
                        mode="gauge+number",
                        value=coherence_moyenne,
                        domain={"x": [0, 1], "y": [0, 1]},
                        title={"text": "Score de cohérence moyen"},
                        gauge={
                            "axis": {"range": [0, 100]},
                            "bar": {"color": COLORS["success"] if coherence_moyenne > 80 else COLORS["warning"]},
                            "steps": [
                                {"range": [0, 50], "color": COLORS["error"]},
                                {"range": [50, 80], "color": COLORS["warning"]},
                                {"range": [80, 100], "color": COLORS["success"]},
                            ]
                        }
                    ))
                    fig_coherence.update_layout(
                        paper_bgcolor=COLORS["bg_secondary"],
                    )
                    st.plotly_chart(fig_coherence, use_container_width=True)
                
                with st.expander("Voir détails des incohérences"):
                    st.dataframe(
                        incoherence_data[["agent_name", "call_time", "customer_intent", "qualification_detected", "coherence_score"]],
                        use_container_width=True
                    )
            else:
                st.success(" Toutes les qualifications sont cohérentes.")

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
# TAB 4 : GÉO-ANALYSE (Supervisors only)
# =============================================================================
if user_role == "superviseur":
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
                color="Score_Moyen", 
                color_continuous_scale=[COLORS["chart_2"], COLORS["chart_1"]],
                labels={"dep": "Département", "Nb_Appels": "Appels"},
                title="Appels par département"
            )
            fig_geo.update_traces(textposition="outside", marker=dict(line=dict(width=0)))
            fig_geo.update_layout(
                paper_bgcolor=COLORS["bg_secondary"], 
                plot_bgcolor=COLORS["bg_secondary"],
                title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                xaxis=dict(title="Département", color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                yaxis=dict(title="Appels", color=COLORS["text_secondary"], gridcolor=COLORS["border_subtle"]),
                legend=dict(font=dict(color=COLORS["text_secondary"]))
            )
            st.plotly_chart(fig_geo, use_container_width=True)

            st.subheader("Détails par code postal")
            cols_geo = [c for c in [
                "agent_name","postal_code","dep","sentiment","score_percentage","performance"
            ] if c in geo_df.columns]
            st.dataframe(geo_df[cols_geo], use_container_width=True)

            st.divider()
            export_buttons(geo_df[cols_geo], "geo_analyse")

# =============================================================================
# TAB 5 : SUIVI PROSPECTS (Supervisors only)
# =============================================================================
if user_role == "superviseur":
    with tab5:
        st.subheader("Suivi Post-Appel")
        
        stats = get_followup_stats()
        
        c1, c2, c3, c4, c5 = st.columns(5)
        with c1: metric_card("Total Prospects", stats.get("total", 0))
        with c2: metric_card("À Relancer", stats.get("a_relancer", 0))
        with c3: metric_card("Relance En Cours", stats.get("relance_en_cours", 0))
        with c4: metric_card("Convertis", stats.get("convertis", 0))
        with c5: metric_card("Taux Conversion", f"{stats.get('taux_conversion', 0)}%")
        
        st.divider()
        
        followups_df = get_followups()
        
        if followups_df.empty:
            st.info("Aucun follow-up enregistré pour le moment.")
        else:
            col_f1, col_f2 = st.columns(2)
            
            with col_f1:
                st.subheader("Répartition par Status")
                status_counts = followups_df["status"].value_counts().reset_index()
                status_counts.columns = ["Status", "Nombre"]
                
                status_labels = {
                    "a_relancer": "À relancer",
                    "relance_en_cours": "Relance en cours",
                    "relance": "Relancé",
                    "converti": "Converti",
                    "injoignable": "Injoignable",
                    "refus_final": "Refus final"
                }
                status_counts["Status"] = status_counts["Status"].map(
                    lambda x: status_labels.get(x, x)
                )
                
                fig_status = px.pie(
                    status_counts,
                    names="Status",
                    values="Nombre",
                    title="Répartition des status"
                )
                fig_status.update_layout(
                    paper_bgcolor=COLORS["bg_secondary"],
                )
                st.plotly_chart(fig_status, use_container_width=True)
            
            with col_f2:
                st.subheader("Par Agent")
                by_agent = followups_df.groupby("agent_name").size().reset_index()
                by_agent.columns = ["Agent", "Nombre"]
                
                fig_agent = px.bar(
                    by_agent,
                    x="Agent",
                    y="Nombre",
                    title="Follow-ups par agent",
                    color_discrete_sequence=[COLORS["accent"]]
                )
                fig_agent.update_layout(
                    paper_bgcolor=COLORS["bg_secondary"],
                    plot_bgcolor=COLORS["bg_secondary"],
                    title=dict(font=dict(color=COLORS["text_primary"], size=16)),
                )
                st.plotly_chart(fig_agent, use_container_width=True)
            
            st.divider()
            st.subheader("Liste des Follow-ups")
            
            st.dataframe(
                followups_df[["agent_name", "appointment_date", "status", "relance_count", "updated_at"]],
                use_container_width=True
            )

# =============================================================================
# TAB 6 : PLANIFICATION IA (Supervisors only)
# =============================================================================
if user_role == "superviseur":
    with tab6:
        st.subheader(" Planification IA - Recommandations")
        
        col_days, col_refresh = st.columns([1, 3])
        with col_days:
            days_option = st.selectbox("Période d'analyse", [7, 14, 30, 90], index=2, format_func=lambda x: f"{x} jours")
        
        with st.spinner("Analyse en cours..."):
            insights = get_planning_insights(days=days_option)
        
        if insights.get("status") == "no_data":
            st.warning(insights.get("message", "Aucune donnée disponible"))
            st.stop()
        
        st.divider()
        
        peak = insights.get("peak_hours", {})
        c1, c2, c3 = st.columns(3)
        with c1: metric_card("Total Appels", peak.get("total_calls", 0))
        with c2: metric_card("Moyenne/heure", peak.get("avg_calls_per_hour", 0))
        with c3: metric_card("Départements", len(set(h.get("hour", 0) for h in peak.get("hourly_breakdown", []) if "hour" in h)))
        
        st.divider()
        st.subheader(" Heures de Pointe")
        
        if peak.get("peak_hours") or peak.get("low_hours"):
            col_p1, col_p2 = st.columns(2)
            
            with col_p1:
                st.success(f"Heures de pointe: {', '.join([f'{h}h' for h in peak.get('peak_hours', [])]) or 'Aucune'}")
            
            with col_p2:
                st.info(f"Heures creuses: {', '.join([f'{h}h' for h in peak.get('low_hours', [])]) or 'Aucune'}")
        
        st.divider()
        st.subheader(" Analyse des Créneaux")
        
        time_slots = insights.get("time_slots", {})
        if time_slots:
            for slot_name, info in time_slots.items():
                with st.expander(f"{slot_name}"):
                    c_s1, c_s2, c_s3 = st.columns(3)
                    with c_s1: metric_card("Appels", info.get("calls", 0))
                    with c_s2: metric_card("Score Moyen", f"{info.get('avg_score', 0)}%")
                    with c_s3: metric_card("Taux Conv.", f"{info.get('conversion_rate', 0)}%")
                    st.write(f"**Recommandation:** {info.get('recommendation', '')}")
        
        st.divider()
        st.subheader("💡 Recommandations IA")
        
        with st.expander("Voir les recommandations détaillées"):
            st.code(insights.get("recommendations", "Aucune recommandation disponible"))
        
        st.divider()
        
        col_r1, col_r2 = st.columns(2)
        with col_r1:
            st.subheader("Top Agents")
            agent_perf = insights.get("agent_performance", {})
            if agent_perf:
                sorted_agents = sorted(
                    agent_perf.items(), 
                    key=lambda x: x[1].get("overall_avg_score", 0), 
                    reverse=True
                )[:5]
                for agent, perf in sorted_agents:
                    with st.expander(f"{agent}"):
                        st.metric("Score Moyen", f"{perf.get('overall_avg_score', 0)}%")
                        st.metric("Total Appels", perf.get("total_calls", 0))
                        slots = perf.get("slots", {})
                        if slots:
                            st.write("**Par créneau:**")
                            for slot, info in slots.items():
                                st.write(f"- {slot}: {info.get('calls')} appels, {info.get('avg_score')}%")
        
        with col_r2:
            st.subheader("Actions Prioritaires")
            recommendations = insights.get("recommendations", "")
            if "ACTIONS RECOMMANDÉES" in recommendations:
                actions_section = recommendations.split("ACTIONS RECOMMANDÉES:")[-1]
                st.markdown(actions_section)
            else:
                st.info("Générer des recommendations...")
