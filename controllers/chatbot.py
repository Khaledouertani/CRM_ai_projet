"""
controllers/chatbot.py
======================
Chatbot IA du CRM — RAG sur les transcriptions + dispatch par intention.

Modifications v2 :
  - RAG réel via services/rag.py (ChromaDB + embeddings)
  - Dispatch par intention (email, bonjour, stats, recherche sémantique)
  - Historique de conversation (mémoire sur la session)
  - Réponses structurées avec insights CRM
"""

import re
from services.rag import search_docs
from services.automation import send_email_mailtrap

# =============================================================================
# MÉMOIRE DE CONVERSATION (session courante uniquement)
# =============================================================================

chat_history: list[dict] = []

def _format_history() -> str:
    """Formate l'historique pour l'inclure dans le prompt LLM."""
    if not chat_history:
        return ""
    lines = []
    for msg in chat_history[-6:]:  # 3 derniers échanges max
        role    = "Utilisateur" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


# =============================================================================
# INTENTIONS RAPIDES (sans LLM)
# =============================================================================

_SALUTATIONS = {"hello", "hi", "salut", "hey", "bonjour", "bonsoir", "coucou"}

_STATS_KEYWORDS = {
    "score", "moyenne", "moyen", "performance", "top agent", "meilleur agent",
    "nombre", "total", "combien", "appels", "résumé global", "statistiques", "stats"
}

def _is_greeting(text: str) -> bool:
    words = set(re.sub(r'[^\w\s]', '', text.lower()).split())
    return bool(words & _SALUTATIONS)

def _is_email_request(text: str) -> bool:
    return any(w in text.lower() for w in ["email", "envoyer", "mail", "rapport par email"])

def _is_stats_request(text: str) -> bool:
    words = set(re.sub(r'[^\w\s]', '', text.lower()).split())
    return bool(words & _STATS_KEYWORDS)


# =============================================================================
# GÉNÉRATION LLM (Ollama)
# =============================================================================
def _llm_answer(context: str, question: str) -> str:
    """
    Appelle Ollama avec le contexte RAG et la question.
    Fallback : retourne un résumé du contexte si Ollama est down.
    """
    try:
        from services.ai import get_available_ollama_model
        import requests as _req

        model = get_available_ollama_model()
        if not model:
            return f"[Ollama indisponible]\n\nContexte trouvé :\n{context[:500]}"

        # ✅ تاريخ المحادثة
        history_str = _format_history()
        history_block = f"Historique :\n{history_str}" if history_str else ""

        # ✅ prompt نظيف
        prompt = f"""Tu es un assistant CRM expert en centre des appels.
Réponds UNIQUEMENT en te basant sur le contexte fourni.
Si l'information n'est pas dans le contexte, dis : "Information non disponible dans les données CRM."
Sois concis, professionnel et donne des insights utiles (agent, sentiment, score, tendance).

{history_block}

Contexte CRM :
{context}

Question :
{question}

Réponse :
"""

        resp = _req.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=60
        )

        if resp.status_code == 200:
            return resp.json().get("response", "").strip()

    except Exception as e:
        print(f"[chatbot] LLM error: {e}")

    # fallback
    return f"Voici ce que j'ai trouvé dans les données :\n\n{context[:600]}..."


# =============================================================================
# RÉPONSES STATISTIQUES RAPIDES (sans RAG)
# =============================================================================

def _stats_answer(question: str) -> str | None:
    """
    Répond aux questions statistiques basiques en interrogeant la DB directement.
    Retourne None si la question ne correspond pas.
    """
    try:
        from models.database import load_data
        df = load_data()
        if df.empty:
            return "Aucune donnée disponible dans la base de données."

        q = question.lower()

        if any(w in q for w in ["top agent", "meilleur agent", "meilleur"]):
            top = df.groupby("agent_name")["score_percentage"].mean().idxmax()
            score = round(df.groupby("agent_name")["score_percentage"].mean().max(), 1)
            return f" Le meilleur agent est **{top}** avec un score moyen de **{score}%**."

        if any(w in q for w in ["score moyen", "moyenne", "score global"]):
            avg = round(df["score_percentage"].mean(), 1)
            return f" Le score moyen global est de **{avg}%** sur **{len(df)}** appels."

        if any(w in q for w in ["combien d'appels", "nombre d'appels", "total appels"]):
            return f" Il y a **{len(df)}** appels enregistrés dans la base."

        if any(w in q for w in ["négatif", "négatifs", "problème", "réclamation"]):
            neg = len(df[df["sentiment"] == "NEGATIVE"])
            pct = round(neg / len(df) * 100, 1) if len(df) > 0 else 0
            return f" **{neg}** appels négatifs ({pct}% du total)."

        if any(w in q for w in ["rdv", "rendez-vous", "appointment"]):
            if "appointment_confidence" in df.columns:
                rdv = len(df[df["appointment_confidence"] > 50])
                return f" **{rdv}** rendez-vous détectés avec haute confiance."

    except Exception as e:
        print(f"[chatbot] stats_answer error: {e}")

    return None


# =============================================================================
# AGENT PRINCIPAL
# =============================================================================

def ai_agent(question: str) -> str:
    """
    Point d'entrée principal du chatbot CRM.

    Flux de décision :
    1. Salutation → réponse rapide
    2. Demande d'email → envoi et confirmation
    3. Question statistique simple → réponse directe DB
    4. Toute autre question → RAG (ChromaDB) + LLM
    """
    global chat_history
    q_clean = question.strip()

    # ── 1. Salutation ──────────────────────────────────────────────────────────
    if _is_greeting(q_clean):
        answer = "Bonjour !  Comment puis-je vous aider avec les données CRM ?"
        chat_history.append({"role": "user",      "content": q_clean})
        chat_history.append({"role": "assistant", "content": answer})
        return answer

    # ── 2. Envoi d'email ───────────────────────────────────────────────────────
    if _is_email_request(q_clean):
        try:
            send_email_mailtrap(
                "admin@crm.local",
                " Rapport CRM IA",
                "Bonjour,\n\nVoici le rapport automatique généré par le CRM IA.\n\n— Assistant CRM"
            )
            answer = " Email de rapport envoyé avec succès à l'administrateur."
        except Exception as e:
            answer = f" Erreur lors de l'envoi de l'email : {e}"
        chat_history.append({"role": "user",      "content": q_clean})
        chat_history.append({"role": "assistant", "content": answer})
        return answer

    # ── 3. Statistiques rapides ───────────────────────────────────────────────
    if _is_stats_request(q_clean):
        stats_reply = _stats_answer(q_clean)
        if stats_reply:
            chat_history.append({"role": "user",      "content": q_clean})
            chat_history.append({"role": "assistant", "content": stats_reply})
            return stats_reply

    # ── 4. RAG — Recherche sémantique dans les transcriptions ─────────────────
    try:
        context = search_docs(q_clean)
    except Exception as e:
        print(f"[chatbot] RAG search error: {e}")
        context = ""

    if not context or len(context.strip()) < 20:
        # Pas de résultat RAG → tentative réponse stats ou message d'erreur
        stats_fallback = _stats_answer(q_clean)
        if stats_fallback:
            answer = stats_fallback
        else:
            answer = (
                "Information non disponible dans les données CRM. "
                "Essaie d'indexer les transcriptions d'abord via **Gestion → Indexer les transcriptions**."
            )
        chat_history.append({"role": "user",      "content": q_clean})
        chat_history.append({"role": "assistant", "content": answer})
        return answer

    # Alerte auto si contexte négatif
    _check_and_alert_negative(context)

    # Génère la réponse LLM avec le contexte RAG
    answer = _llm_answer(context, q_clean)

    chat_history.append({"role": "user",      "content": q_clean})
    chat_history.append({"role": "assistant", "content": answer})

    return answer


# =============================================================================
# ALERTE AUTOMATIQUE SI CONTEXTE NÉGATIF
# =============================================================================

def _check_and_alert_negative(context: str):
    """
    Envoie une alerte email si le contexte RAG contient des appels négatifs.
    Evite d'envoyer en boucle avec un flag de session.
    """
    try:
        import streamlit as st
        if st.session_state.get("_last_alert_context") == context[:50]:
            return  # Déjà alerté pour ce contexte

        if any(w in context.lower() for w in ["negative", "réclamation", "problème", "insatisfait"]):
            # Extrait l'agent si possible
            agent_match = re.search(r"Agent[:\s]+([A-Za-zÀ-ÿ]+)", context)
            agent_str   = agent_match.group(1) if agent_match else "Inconnu"

            send_email_mailtrap(
                "admin@crm.local",
                " Alerte CRM — Appels négatifs détectés",
                f"Des appels problématiques ont été identifiés.\n\n"
                f"Agent détecté : {agent_str}\n\n"
                f"Extrait du contexte :\n{context[:400]}\n\n"
                f"Action recommandée : vérifier les appels et recontacter les clients."
            )
            st.session_state["_last_alert_context"] = context[:50]
    except Exception:
        pass