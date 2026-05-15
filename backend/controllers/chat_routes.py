"""
controllers/chat_routes.py
==========================
Chatbot routes for CRM AI Backend.
Connects to MySQL to provide role-based answers:
  - Admin: sees ALL agents data
  - Agent: sees ONLY their own data
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import pymysql
import json
import os
from services.auth_service import verify_token

# Load config for LLM settings
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    role: str = "agent"
    agent_name: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sources: Optional[list] = None


def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )


def build_mysql_context(role: str, agent_name: str = None) -> str:
    """
    Build a rich context string from MySQL data.
    - Admin: all agents, all calls
    - Agent: only their own calls
    """
    conn = get_db()
    context_parts = []

    try:
        with conn.cursor() as cur:
            # ── Filter clause ──
            if role == "admin":
                where = ""
                params = []
            else:
                where = "WHERE agent_name = %s"
                params = [agent_name]

            # 1. Global KPIs
            cur.execute(f"SELECT COUNT(*) as total, AVG(score_percentage) as avg_score FROM calls {where}", params)
            row = cur.fetchone()
            total = row["total"]
            avg_score = round(row["avg_score"] or 0, 1)
            context_parts.append(f"📊 Statistiques Globales: {total} appels analysés, score moyen {avg_score}%")

            # 2. Sentiment distribution
            cur.execute(f"SELECT sentiment, COUNT(*) as cnt FROM calls {where} GROUP BY sentiment", params)
            sentiments = {r["sentiment"]: r["cnt"] for r in cur.fetchall()}
            sent_str = ", ".join([f"{k}: {v}" for k, v in sentiments.items()])
            context_parts.append(f"😊 Sentiments: {sent_str}")

            # 3. Performance distribution
            cur.execute(f"SELECT performance, COUNT(*) as cnt FROM calls {where} AND performance IS NOT NULL GROUP BY performance" if where else "SELECT performance, COUNT(*) as cnt FROM calls WHERE performance IS NOT NULL GROUP BY performance", params)
            perfs = {r["performance"]: r["cnt"] for r in cur.fetchall()}
            perf_str = ", ".join([f"{k}: {v}" for k, v in perfs.items()])
            context_parts.append(f"⭐ Performances: {perf_str}")

            # 4. Agent rankings (admin only)
            if role == "admin":
                cur.execute("""
                    SELECT agent_name,
                           COUNT(*) as nb_appels,
                           ROUND(AVG(score_percentage), 1) as score_moy,
                           SUM(CASE WHEN sentiment='POSITIVE' THEN 1 ELSE 0 END) as positifs,
                           SUM(CASE WHEN sentiment='NEGATIVE' THEN 1 ELSE 0 END) as negatifs
                    FROM calls GROUP BY agent_name ORDER BY score_moy DESC
                """)
                agents = cur.fetchall()
                if agents:
                    context_parts.append("\n👥 Classement des agents:")
                    for i, a in enumerate(agents, 1):
                        context_parts.append(
                            f"  {i}. {a['agent_name']}: score {a['score_moy']}%, "
                            f"{a['nb_appels']} appels, {a['positifs']} positifs, {a['negatifs']} négatifs"
                        )
                    best = agents[0]
                    worst = agents[-1]
                    context_parts.append(f"\n🏆 Meilleur agent: {best['agent_name']} (score {best['score_moy']}%)")
                    context_parts.append(f"⚠️ Agent à former: {worst['agent_name']} (score {worst['score_moy']}%)")

            # 5. Radar scores (competences)
            cur.execute(f"""
                SELECT
                    ROUND(AVG(score_ecoute), 1) as ecoute,
                    ROUND(AVG(score_persuasion), 1) as persuasion,
                    ROUND(AVG(score_empathie), 1) as empathie,
                    ROUND(AVG(score_argumentation), 1) as argumentation,
                    ROUND(AVG(score_refus), 1) as refus,
                    ROUND(AVG(score_vente), 1) as vente
                FROM calls {where}
            """, params)
            scores = cur.fetchone()
            if scores:
                context_parts.append(
                    f"\n📈 Scores compétences: Écoute={scores['ecoute']}/10, "
                    f"Persuasion={scores['persuasion']}/10, Empathie={scores['empathie']}/10, "
                    f"Argumentation={scores['argumentation']}/10, Gestion refus={scores['refus']}/10, "
                    f"Vente={scores['vente']}/10"
                )

            # 6. Recent refusal reasons
            refusal_where = f"{where} AND refusal_reason IS NOT NULL AND refusal_reason != ''" if where else "WHERE refusal_reason IS NOT NULL AND refusal_reason != ''"
            cur.execute(f"SELECT refusal_reason, COUNT(*) as cnt FROM calls {refusal_where} GROUP BY refusal_reason ORDER BY cnt DESC LIMIT 5", params)
            refusals = cur.fetchall()
            if refusals:
                ref_str = ", ".join([f"{r['refusal_reason']}: {r['cnt']}" for r in refusals])
                context_parts.append(f"\n❌ Motifs de refus: {ref_str}")

            # 7. Last 10 calls summaries
            cur.execute(f"""
                SELECT agent_name, sentiment, score_percentage, summary, call_date
                FROM calls {where}
                ORDER BY call_date DESC LIMIT 10
            """, params)
            recent = cur.fetchall()
            if recent:
                context_parts.append(f"\n📞 Derniers appels:")
                for c in recent:
                    date_str = str(c['call_date'])[:16] if c['call_date'] else '?'
                    summary = (c['summary'] or '')[:120]
                    context_parts.append(
                        f"  - [{date_str}] {c['agent_name']}: {c['sentiment']} "
                        f"(score {c['score_percentage']}%) — {summary}"
                    )

            # 8. Hourly distribution
            cur.execute(f"""
                SELECT HOUR(call_date) as h, COUNT(*) as cnt
                FROM calls {where} {'AND' if where else 'WHERE'} call_date IS NOT NULL
                GROUP BY HOUR(call_date) ORDER BY h
            """, params)
            hourly = cur.fetchall()
            if hourly:
                peak = max(hourly, key=lambda x: x["cnt"])
                context_parts.append(f"\n⏰ Heure de pointe: {peak['h']}h ({peak['cnt']} appels)")

    finally:
        conn.close()

    return "\n".join(context_parts)


def get_chat_response(question: str, role: str = "agent", agent_name: str = None) -> dict:
    """
    Get chatbot response using MySQL data + Ollama LLM.
    """
    q_lower = question.lower().strip()
    
    # 0. Quick response for simple greetings
    greetings = ["hello", "hi", "bonjour", "salut", "cc", "coucou", "hey"]
    if any(q_lower == g for g in greetings) or q_lower == "test":
        name_str = agent_name if agent_name else "l'administrateur"
        return {
            "response": f"Bonjour {name_str} ! Je suis votre assistant CRM IA. Je suis prêt à analyser vos données. Que souhaitez-vous savoir ? (ex: 'Quel est mon meilleur agent ?', 'Résumé des derniers appels')",
            "sources": []
        }

    # 1. Build MySQL context based on role
    try:
        context = build_mysql_context(role, agent_name)
    except Exception as e:
        context = f"Erreur de connexion MySQL: {str(e)}"

    # 2. Build prompt for LLM
    role_desc = "un superviseur admin qui voit TOUTES les données" if role == "admin" else f"l'agent '{agent_name}'"

    prompt = f"""Tu es un assistant CRM IA pour un centre d'appels.
Tu parles à {role_desc}.

DONNÉES RÉELLES (MySQL):
{context}

QUESTION: {question}

RÉPONSE (précise, professionnelle, en français):"""

    # 3. Call Ollama
    try:
        import requests
        llm_cfg = CONFIG.get("llm", {})
        model_name = llm_cfg.get("model", "gemma3:4b")
        
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 500,
                    "temperature": llm_cfg.get("temperature", 0.3)
                }
            },
            timeout=llm_cfg.get("timeout", 45)
        )

        if ollama_response.status_code == 200:
            response_text = ollama_response.json().get("response", "Désolé, je n'ai pas pu générer de réponse.")
        else:
            response_text = f"L'IA Ollama a retourné une erreur ({ollama_response.status_code}). Voici les données brutes de votre CRM :\n\n{context}"

    except requests.exceptions.Timeout:
        response_text = f"⌛ Le modèle IA ({model_name}) met trop de temps à répondre sur votre machine. Voici un résumé direct de vos données :\n\n{context}"
    except requests.exceptions.ConnectionError:
        response_text = f"❌ Ollama n'est pas lancé sur le port 11434. Veuillez lancer 'ollama serve' pour activer l'IA. En attendant, voici vos données :\n\n{context}"
    except Exception as e:
        response_text = f"⚠️ Une erreur est survenue : {str(e)[:100]}. Voici vos données :\n\n{context}"

    return {
        "response": response_text,
        "sources": ["Base de données MySQL (pfe_crm_ia)"]
    }


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    Chat endpoint connected to MySQL.

    POST /api/chat
    Body: {"message": "Quel est le meilleur agent?", "role": "admin"}

    - Admin: receives context from ALL agents data
    - Agent: receives context from ONLY their own data
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Verify token
    user_info = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0] == "Bearer":
            user_info = verify_token(parts[1])

    # Determine role and agent filter
    role = "agent"
    agent_name = request.agent_name

    if user_info:
        role = user_info.get("role", "agent")
        if role != "admin" and not agent_name:
            agent_name = user_info.get("username")

    # Get response with MySQL context
    result = get_chat_response(request.message, role, agent_name)

    return ChatResponse(
        response=result["response"],
        sources=result.get("sources", [])
    )


@router.get("/history")
async def get_chat_history(authorization: Optional[str] = Header(None)):
    """Get chat history (placeholder)."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    return {"history": []}