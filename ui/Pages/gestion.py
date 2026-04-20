"""
ui/Pages/gestion.py  (anciennement dashboard.py)
=================================================
Page de gestion : Nouvelle analyse + Pointage + Paramètres IA + RAG.

Modifications v2 :
  - Affichage diarization [Agent]/[Client] dans le rapport
  - Affichage mots-clés, inactivité, temps de parole
  - Keywords sauvegardés en JSON
  - Accès réservé aux superviseurs (via check_supervisor)
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import streamlit as st
import pandas as pd
import requests
import json

from models.database import insert_call, load_data
from ui.style import inject_custom_css, detail_card
from ui.app import show_navbar, check_login, check_supervisor

inject_custom_css()

# ── Auth ───────────────────────────────────────────────────────────────────────
check_login()
check_supervisor()   # Bloqué aux superviseurs
show_navbar()

st.title(" Gestion")

tab1, tab2, tab3 = st.tabs(["  Nouvelle Analyse", "  Pointage Agents", "  Paramètres IA"])

# =============================================================================
# TAB 1 : NOUVELLE ANALYSE
# =============================================================================
with tab1:
    data = load_data()

    agents = sorted(data["agent_name"].dropna().unique().tolist()) \
             if not data.empty and "agent_name" in data.columns \
             else ["Agent_1", "Agent_2", "Agent_3"]

    st.subheader("Détails de l'appel")
    col1, col2 = st.columns(2)
    with col1:
        agent_name = st.selectbox("Choisir l'agent", agents, key="new_agent")
    with col2:
        audio = st.file_uploader("Charger le fichier audio (MP3/WAV)", type=["mp3", "wav"])

    col3, col4 = st.columns(2)
    with col3:
        call_date = st.date_input("Date de l'Appel")
    with col4:
        call_time_input = st.time_input("Heure de l'Appel")

    if audio:
        os.makedirs("audio", exist_ok=True)
        path = f"audio/{audio.name}"
        with open(path, "wb") as f:
            f.write(audio.getbuffer())
        st.audio(path)

        if st.button("Lancer l'Analyse IA", type="primary"):
            with st.spinner("Analyse sémantique + diarization en cours..."):
                try:
                    res = requests.post(
                        "http://127.0.0.1:8000/analyze_call",
                        data={"audio_path": path, "agent_name": agent_name},
                        timeout=300
                    )
                    result = res.json()

                    if "error" not in result:
                        st.session_state["pending_analysis"]     = result
                        st.session_state["pending_audio_path"]   = path
                        st.session_state["pending_call_datetime"] = pd.Timestamp.combine(
                            call_date, call_time_input
                        )
                        st.session_state["pending_agent_name"]   = agent_name
                        st.rerun()
                    else:
                        st.error(f"Erreur API : {result['error']}")
                except Exception as e:
                    st.error(f"FastAPI inaccessible : {e}")

    # ── Rapport d'analyse ─────────────────────────────────────────────────────
    if "pending_analysis" in st.session_state:
        st.divider()
        st.subheader("Rapport d'Analyse IA")

        result        = st.session_state["pending_analysis"]
        path          = st.session_state["pending_audio_path"]
        call_datetime = st.session_state["pending_call_datetime"]
        agent_name    = st.session_state["pending_agent_name"]

        # ── Transcription + résumé ─────────────────────────────────────────────
        detail_card("Transcription brute", result.get("transcription", ""))
        detail_card("Résumé Exécutif",     result.get("summary", ""))

        ──────────────────────────────────────
        labeled = result.get("labeled_transcript", "")
        if labeled:
            st.markdown("**Transcription diarisée**")
            diar_method = result.get("diarization_method", "none")
            method_badge = {
                "pyannote":  " Pyannote (haute précision)",
                "heuristic": " Heuristique (estimation)",
                "none":      " Non disponible",
            }.get(diar_method, diar_method)
            st.caption(f"Méthode : {method_badge}")

            # Affiche les lignes avec couleur par rôle
            for line in labeled.split("\n"):
                if line.startswith("[Agent]"):
                    st.markdown(
                        f"<div style='background:#1a2a1a;border-left:3px solid #22c55e;"
                        f"padding:8px 12px;border-radius:4px;margin:3px 0;font-size:14px;color:#d1d5db;'>"
                        f"{line}</div>", unsafe_allow_html=True
                    )
                elif line.startswith("[Client]"):
                    st.markdown(
                        f"<div style='background:#1a1a2e;border-left:3px solid #6366f1;"
                        f"padding:8px 12px;border-radius:4px;margin:3px 0;font-size:14px;color:#d1d5db;'>"
                        f"{line}</div>", unsafe_allow_html=True
                    )

        # ── Temps de parole ────────────────────────────────────────────────────
        agent_ratio  = result.get("agent_talk_ratio", 0)
        client_ratio = result.get("client_talk_ratio", 0)
        if agent_ratio > 0 or client_ratio > 0:
            st.markdown("**Temps de parole**")
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("Agent",  f"{round(agent_ratio*100)}%",
                          f"{round(result.get('agent_seconds',0))}s")
            with col_b:
                st.metric("Client", f"{round(client_ratio*100)}%",
                          f"{round(result.get('client_seconds',0))}s")

        st.divider()

        # ── Métriques ──────────────────────────────────────────────────────────
        c1, c2, c3 = st.columns(3)
        with c1: detail_card("Sentiment",    result.get("sentiment", "N/A"))
        with c2: detail_card("Problème",     result.get("problem", "Aucun") or "Aucun")
        with c3: detail_card("Code Postal",  result.get("postal_code", "Non renseigné") or "Non renseigné")

        c4, c5, c6 = st.columns(3)
        with c4: detail_card("Script Respecté",   "Oui" if result.get("script_respected") else "Non")
        with c5: detail_card("Objections Gérées", "Oui" if result.get("objections_handled") else "Non")
        with c6: detail_card("Politesse Agent",   f"{result.get('agent_politeness', 5)}/10")

        c7, c8 = st.columns(2)
        with c7: detail_card("Intention Client",   result.get("customer_intent", "Inconnue"))
        with c8: detail_card("Performance Globale",
                              f"{result.get('performance','')} ({round(result.get('score',0),1)}/100)")

        detail_card("Prochaines Étapes", result.get("next_steps", "Aucune recommandation"))

        ───────────────────────────────────────────────────────
        keywords = result.get("keywords", [])
        if keywords:
            st.markdown("**Mots-clés détectés**")
            tags_html = "".join([
                f"<span style='background:#1e293b;color:#93c5fd;border:1px solid #334155;"
                f"border-radius:20px;padding:3px 12px;margin:3px;font-size:13px;'>{k}</span>"
                for k in keywords
            ])
            st.markdown(f"<div style='display:flex;flex-wrap:wrap;'>{tags_html}</div>",
                        unsafe_allow_html=True)

         ──────────────────────────────────────────────────────
        if result.get("inactivity_detected"):
            duration = result.get("inactivity_duration", 0)
            st.warning(f" Inactivité détectée : silence de **{duration:.1f}s** dans l'appel")

        # ── RDV ───────────────────────────────────────────────────────────────
        rdv_confidence = result.get("appointment_confidence", 0)
        if rdv_confidence > 0:
            st.warning(f" Rendez-vous détecté (Confiance : {rdv_confidence}%)")
            new_date = st.text_input("Date et heure du RDV :", result.get("appointment_date", ""))
            result["appointment_date"] = new_date
            st.session_state["pending_analysis"]["appointment_date"] = new_date

        st.divider()

        # ── Enregistrement ────────────────────────────────────────────────────
        if st.button(" Enregistrer dans la Base de Données", type="secondary"):
            insert_call({
                "agent_name":           agent_name,
                "audio_path":           path,
                "transcription":        result.get("transcription", ""),
                "sentiment":            result.get("sentiment", ""),
                "sentiment_score":      result.get("score", 0) / 100,
                "score_percentage":     result.get("score", 0),
                "performance":          result.get("performance", ""),
                "summary":              result.get("summary", ""),
                "keywords":             result.get("keywords", []),
                "call_type":            result.get("customer_intent", ""),
                "problem":              result.get("problem", ""),
                "postal_code":          result.get("postal_code", ""),
                "script_respected":     result.get("script_respected", False),
                "customer_intent":      result.get("customer_intent", ""),
                "objections_handled":   result.get("objections_handled", False),
                "agent_politeness":     result.get("agent_politeness", 5),
                "next_steps":           result.get("next_steps", ""),
                "appointment_date":     result.get("appointment_date", ""),
                "appointment_confidence": result.get("appointment_confidence", 0),
                "score_ecoute":         result.get("score_ecoute", 0),
                "score_persuasion":     result.get("score_persuasion", 0),
                "score_empathie":       result.get("score_empathie", 0),
                "score_argumentation":  result.get("score_argumentation", 0),
                "score_refus":          result.get("score_refus", 0),
                "score_vente":          result.get("score_vente", 0),
                
                "labeled_transcript":   result.get("labeled_transcript", ""),
                "agent_text":           result.get("agent_text", ""),
                "client_text":          result.get("client_text", ""),
                "agent_talk_ratio":     result.get("agent_talk_ratio", 0.0),
                "client_talk_ratio":    result.get("client_talk_ratio", 0.0),
                "agent_seconds":        result.get("agent_seconds", 0.0),
                "client_seconds":       result.get("client_seconds", 0.0),
                "diarization_method":   result.get("diarization_method", "none"),
                
                "inactivity_detected":  result.get("inactivity_detected", False),
                "inactivity_duration":  result.get("inactivity_duration", 0.0),
                "call_time":            call_datetime.strftime("%Y-%m-%d %H:%M:%S"),
            })
            st.success(" Appel enregistré dans MySQL.")

            # Alerte score faible
            try:
                with open("config.json") as f:
                    conf     = json.load(f)
                    min_s    = conf.get("alerts", {}).get("min_score", 70)
                    alert_to = conf.get("alerts", {}).get("alert_email", "")
                if result.get("score", 0) < min_s and alert_to:
                    from services.automation import send_email_mailtrap
                    send_email_mailtrap(
                        alert_to,
                        " Alerte Performance CRM IA",
                        f"L'agent {agent_name} a un score de {result.get('score',0)}/100."
                    )
                    st.toast("Alerte email envoyée au superviseur.")
            except Exception:
                pass

            for k in ["pending_analysis", "pending_audio_path",
                      "pending_call_datetime", "pending_agent_name"]:
                st.session_state.pop(k, None)

# =============================================================================
# TAB 2 : POINTAGE
# =============================================================================
with tab2:
    st.subheader("Suivi des Présences")
    data_p = load_data()

    if data_p.empty:
        st.warning("Aucune donnée disponible.")
    else:
        data_p["call_time"] = pd.to_datetime(data_p["call_time"], errors="coerce")
        data_p = data_p.dropna(subset=["call_time"])
        data_p["Date"] = data_p["call_time"].dt.date

        pointage = data_p.groupby(["agent_name", "Date"]).agg(
            Premier_Appel=("call_time", "min"),
            Dernier_Appel=("call_time", "max"),
            Total_Appels=("call_id",   "count")
        ).reset_index()

        pointage["Heure_Arrivee"]    = pointage["Premier_Appel"].dt.strftime('%H:%M:%S')
        pointage["Heure_Depart"]     = pointage["Dernier_Appel"].dt.strftime('%H:%M:%S')
        pointage["Heures_Travaillees"] = (
            (pointage["Dernier_Appel"] - pointage["Premier_Appel"])
            .dt.total_seconds() / 3600
        ).round(2)

        std_start = pd.to_datetime("09:15:00").time()
        pointage["Statut"] = pointage["Premier_Appel"].dt.time.apply(
            lambda x: " En Retard" if x > std_start else "✅ À l'heure"
        )

        df_display = pointage[[
            "Date", "agent_name", "Heure_Arrivee", "Heure_Depart",
            "Heures_Travaillees", "Total_Appels", "Statut"
        ]].sort_values(by=["Date", "agent_name"], ascending=[False, True])

        st.dataframe(df_display, use_container_width=True)
        st.divider()

        csv_p = df_display.to_csv(index=False).encode("utf-8")
        st.download_button(" Exporter le Pointage (CSV)", csv_p, "pointage_agents.csv", "text/csv")

# =============================================================================
# TAB 3 : PARAMÈTRES IA
# =============================================================================
with tab3:
    st.subheader("Configuration du Modèle de Scoring")

    try:
        with open("config.json") as f:
            t3_conf = json.load(f)
    except Exception:
        t3_conf = {
            "weights": {"ecoute": 20, "persuasion": 20, "empathie": 15,
                        "argumentation": 15, "refus": 15, "vente": 15},
            "alerts":  {"min_score": 70, "alert_email": ""}
        }

    w = t3_conf["weights"]
    colA, colB = st.columns(2)
    with colA:
        ecoute        = st.slider("Écoute active",        0, 100, w.get("ecoute", 20))
        persuasion    = st.slider("Persuasion",           0, 100, w.get("persuasion", 20))
        empathie      = st.slider("Empathie",             0, 100, w.get("empathie", 15))
    with colB:
        argumentation = st.slider("Argumentation",        0, 100, w.get("argumentation", 15))
        refus         = st.slider("Gestion des refus",    0, 100, w.get("refus", 15))
        vente         = st.slider("Conclusion de vente",  0, 100, w.get("vente", 15))

    total_w = ecoute + persuasion + empathie + argumentation + refus + vente
    if total_w != 100:
        st.error(f" Le total doit être 100 (actuel : {total_w})")

    st.divider()
    st.subheader("Système d'Alertes")
    min_score   = st.number_input("Score minimal requis", value=t3_conf.get("alerts", {}).get("min_score", 70))
    alert_email = st.text_input("Email administrateur",  value=t3_conf.get("alerts", {}).get("alert_email", ""))

    if st.button(" Sauvegarder la configuration"):
        if total_w == 100:
            t3_conf["weights"] = {
                "ecoute": ecoute, "persuasion": persuasion, "empathie": empathie,
                "argumentation": argumentation, "refus": refus, "vente": vente
            }
            t3_conf["alerts"] = {"min_score": int(min_score), "alert_email": alert_email}
            with open("config.json", "w") as f:
                json.dump(t3_conf, f)
            st.success(" Configuration mise à jour.")
        else:
            st.error("Impossible de sauvegarder : la somme doit faire 100.")

    st.divider()
    st.subheader(" Moteur RAG (Recherche Sémantique)")
    st.markdown("Indexe toutes les transcriptions dans ChromaDB pour la recherche sémantique du chatbot.")

    if st.button(" Indexer toutes les transcriptions", type="primary", key="btn_rag"):
        with st.spinner("Indexation en cours..."):
            try:
                from services.rag import index_all_calls
                msg = index_all_calls()
                st.success(f"{msg}")
            except Exception as e:
                st.error(f"Erreur RAG : {e}")
