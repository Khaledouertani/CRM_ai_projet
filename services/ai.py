import whisper
from transformers import pipeline
import requests
import json
import re

# =========================
# CHARGEMENT DES MODELES
# =========================

print("Chargement du modèle Whisper...")
whisper_model = whisper.load_model("base")

print("Chargement du modèle Sentiment (Fallback)...")
sentiment_model = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

print("Modèles chargés")

# =========================
# DETECTION DU MODELE OLLAMA DISPONIBLE
# =========================

def get_available_ollama_model():
    """
    Détecte automatiquement le meilleur modèle Ollama installé.
    Essaie d'abord llama3, puis gemma3:4b, puis n'importe quel autre modèle.
    """
    preferred_models = ["llama3.1", "gemma3:4b", "llama3", "gemma3", "mistral", "phi3"]

    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=3)
        if response.status_code == 200:
            available = [m["name"] for m in response.json().get("models", [])]
            print(f"Modèles Ollama disponibles : {available}")

            for preferred in preferred_models:
                for available_model in available:
                    if preferred in available_model.lower():
                        print(f"Utilisation du modèle : {available_model}")
                        return available_model

            if available:
                print(f"Utilisation du premier modèle disponible : {available[0]}")
                return available[0]
    except Exception as e:
        print(f"Ollama non accessible : {e}")

    return None


# =========================
# TRANSCRIPTION AUDIO
# =========================

def transcribe_audio(audio_path):
    try:
        result = whisper_model.transcribe(audio_path)
        return result["text"].strip()
    except Exception as e:
        print("Erreur transcription :", e)
        return ""


# =========================
# EXTRACTION CODE POSTAL (Regex)
# =========================

def extract_postal_code(text):
    """
    Extrait le premier code postal français (5 chiffres) trouvé dans le texte.
    """
    if not text:
        return None
    match = re.search(r'\b\d{5}\b', text)
    return match.group(0) if match else None


# =========================
# ✅ NOUVEAU — DÉTECTION D'INACTIVITÉ
# =========================

def detect_inactivity(audio_path, silence_threshold_seconds=30):
    """
    Détecte les silences/inactivités de plus de N secondes dans l'audio.

    Utilise les timestamps de Whisper (word-level ou segment-level) pour
    identifier les gaps entre segments de parole.

    Retourne :
        inactivity_detected (bool)  : True si un silence > seuil détecté
        inactivity_duration (float) : Durée du plus long silence en secondes
        inactivity_moments (list)   : Liste des moments d'inactivité [{start, end, duration}]
    """
    result = {
        "inactivity_detected": False,
        "inactivity_duration": 0.0,
        "inactivity_moments": []
    }

    try:
        # Transcription avec timestamps par segment
        transcription_result = whisper_model.transcribe(
            audio_path,
            verbose=False,
            word_timestamps=False   # segments suffisent, plus rapide
        )

        segments = transcription_result.get("segments", [])

        if len(segments) < 2:
            return result

        moments = []
        max_silence = 0.0

        for i in range(1, len(segments)):
            prev_end   = segments[i - 1]["end"]
            curr_start = segments[i]["start"]
            gap        = curr_start - prev_end

            if gap >= silence_threshold_seconds:
                moment = {
                    "start":    round(prev_end, 1),
                    "end":      round(curr_start, 1),
                    "duration": round(gap, 1)
                }
                moments.append(moment)
                if gap > max_silence:
                    max_silence = gap

        if moments:
            result["inactivity_detected"] = True
            result["inactivity_duration"] = round(max_silence, 1)
            result["inactivity_moments"]  = moments
            print(
                f"  Inactivité détectée : {len(moments)} pause(s), "
                f"max = {max_silence:.1f}s"
            )

    except Exception as e:
        print(f"Erreur détection inactivité : {e}")

    return result


# =========================
# ✅ NOUVEAU — VALIDATION DES SCORES LLM
# =========================

def _safe_int(value, default=5, min_val=0, max_val=10):
    """
    Convertit une valeur en entier dans [min_val, max_val].
    Retourne default si la conversion échoue.
    """
    try:
        return max(min_val, min(int(value), max_val))
    except (TypeError, ValueError):
        return default


def _safe_str(value, default=""):
    """Retourne une chaîne propre ou default."""
    if value is None:
        return default
    return str(value).strip()


def _safe_bool(value, default=False):
    """Convertit diverses représentations en bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "oui", "yes", "1")
    if isinstance(value, int):
        return value == 1
    return default


# =========================
# ✅ AMÉLIORÉ — EXTRACTION MOTS-CLÉS (Fallback sans LLM)
# =========================

# Dictionnaire de mots-clés métier CRM, classés par catégorie
KEYWORD_CATEGORIES = {
    "problème":     ["problème", "pb", "panne", "erreur", "bug", "défaut", "cassé", "broken"],
    "réclamation":  ["réclamation", "plainte", "insatisfait", "mécontent", "colère", "inacceptable"],
    "facture":      ["facture", "paiement", "prix", "tarif", "remboursement", "trop cher", "coût"],
    "rendez-vous":  ["rendez-vous", "rdv", "appointment", "visite", "passage", "technicien"],
    "annulation":   ["annuler", "annulation", "résilier", "résiliation", "arrêter", "stop"],
    "satisfaction": ["satisfait", "content", "excellent", "bravo", "parfait", "super", "merci"],
    "énergie":      ["électricité", "gaz", "énergie", "chauffage", "panneaux", "photovoltaïque"],
    "isolation":    ["isolation", "toiture", "combles", "façade", "travaux", "devis"],
    "refus":        ["non", "pas intéressé", "refus", "ne veux pas", "arrêtez", "raccrocher"],
    "urgence":      ["urgent", "immédiat", "maintenant", "tout de suite", "vite"],
}

def extract_keywords_fallback(text):
    """
    Extrait les mots-clés pertinents depuis le texte via dictionnaire métier.
    Utilisé comme fallback si Ollama est indisponible.
    Retourne une liste de mots-clés uniques détectés (max 10).
    """
    if not text:
        return []

    lower = text.lower()
    found = []

    for category, words in KEYWORD_CATEGORIES.items():
        for word in words:
            if word in lower and category not in found:
                found.append(category)
                break  # une seule occurrence par catégorie

    return found[:10]


# =========================
# ✅ AMÉLIORÉ — ANALYSE SÉMANTIQUE (LLM via Ollama)
# =========================

def analyze_transcript_with_llm(text):
    """
    Appelle Ollama pour extraire les informations de la transcription.

    Améliorations vs version originale :
    - ✅ Résumé réel (2-3 phrases) au lieu de text[:150]
    - ✅ Mots-clés extraits par le LLM (liste de 5-8 termes)
    - ✅ Validation stricte de tous les champs LLM (types, ranges)
    - ✅ Fallback mots-clés via dictionnaire métier si Ollama down
    - ✅ Fallback résumé intelligent (première phrase + tronquage propre)
    """
    default_response = {
        # ── Résumé ─────────────────────────────────────────────────────────────
        # ✅ Fallback : première phrase complète (pas une coupure brute)
        "summary": _build_fallback_summary(text),

        # ── Sentiment ──────────────────────────────────────────────────────────
        "sentiment":       "NEUTRAL",
        "sentiment_score": 0.5,

        # ── Analyse appel ──────────────────────────────────────────────────────
        "problem":          "",
        "postal_code":      "",
        "script_respected": False,
        "customer_intent":  "",
        "objections_handled": False,
        "agent_politeness": 5,
        "next_steps":       "",

        # ── Rendez-vous ────────────────────────────────────────────────────────
        "appointment_date":       "",
        "appointment_confidence": 0,

        # ── Scores individuels (1-10) ──────────────────────────────────────────
        "score_ecoute":        0,
        "score_persuasion":    0,
        "score_empathie":      0,
        "score_argumentation": 0,
        "score_refus":         0,
        "score_vente":         0,

        # ✅ NOUVEAU : mots-clés (liste)
        "keywords": [],

        # ✅ NOUVEAU : inactivité (rempli séparément par detect_inactivity)
        "inactivity_detected": False,
        "inactivity_duration": 0.0,
    }

    if not text:
        return default_response

    # Extraction Regex prioritaire (plus fiable pour les codes postaux)
    regex_pc = extract_postal_code(text)
    if regex_pc:
        default_response["postal_code"] = regex_pc

    # Détection modèle Ollama
    return "gemma3:4b"

    if model_name:
        try:
            # ── ✅ PROMPT AMÉLIORÉ ─────────────────────────────────────────────
            prompt = f"""Tu es un assistant CRM expert en centre d'appels. Analyse cette transcription et retourne UNIQUEMENT un JSON valide, sans texte autour.

Champs requis :
1. summary         : Résumé clair en 2-3 phrases complètes de l'appel (PAS une coupure du texte, une vraie synthèse).
2. keywords        : Liste de 5 à 8 mots-clés métier extraits de la transcription (ex: ["énergie", "toiture", "rendez-vous", "refus"]).
3. sentiment       : POSITIVE, NEGATIVE ou NEUTRAL.
4. problem         : Courte description du problème ou réclamation (chaîne vide si aucun).
5. postal_code     : Code postal mentionné (chaîne vide si aucun).
6. script_respected: true si l'agent a bien salué et guidé poliment, false sinon.
7. customer_intent : Exactement une des valeurs : "Hors cible logement", "RDV client 1", "RDV client 2", "Rappel", "Refus", "RDV annulé", "Répondeur", "Hors cible langue".
8. appointment_date: Date/heure du rendez-vous si pris (ex: "Lundi 13h") ou chaîne vide.
9. appointment_confidence: Entier 0-100 représentant la certitude qu'un RDV a été pris.
10. score_ecoute       : Entier 1-10 (qualité d'écoute de l'agent).
11. score_persuasion   : Entier 1-10 (capacité à convaincre).
12. score_empathie     : Entier 1-10 (empathie ressentie).
13. score_argumentation: Entier 1-10 (qualité des arguments).
14. score_refus        : Entier 1-10 (gestion des objections/refus).
15. score_vente        : Entier 1-10 (efficacité commerciale).
16. objections_handled : true si l'agent a géré les objections avec succès.
17. agent_politeness   : Entier 1-10 (politesse générale).
18. next_steps         : Prochaine action recommandée ou raison du refus.

Transcription : "{text}"

JSON attendu (exemple) :
{{
  "summary": "L'agent a contacté Mme Martin pour lui proposer une aide de l'État pour la rénovation énergétique. La cliente est propriétaire et éligible. Un rendez-vous technicien a été fixé.",
  "keywords": ["énergie", "toiture", "aide état", "rendez-vous", "isolation", "propriétaire"],
  "sentiment": "POSITIVE",
  "problem": "",
  "postal_code": "75001",
  "script_respected": true,
  "customer_intent": "RDV client 1",
  "appointment_date": "Lundi 13h",
  "appointment_confidence": 90,
  "score_ecoute": 8,
  "score_persuasion": 7,
  "score_empathie": 9,
  "score_argumentation": 7,
  "score_refus": 6,
  "score_vente": 8,
  "objections_handled": true,
  "agent_politeness": 9,
  "next_steps": "Confirmer le rendez-vous par SMS"
}}"""

            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model":  model_name,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=60
            )

            if response.status_code == 200:
                data        = response.json()
                raw_response = data["response"]

                # Protection : extraction du bloc JSON si Ollama ajoute du texte autour
                json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
                if json_match:
                    raw_response = json_match.group(0)

                llm = json.loads(raw_response)

                # ── ✅ Mapping avec validation stricte ─────────────────────────

                # Résumé — vérifie que c'est bien un résumé (pas juste le début du texte)
                raw_summary = _safe_str(llm.get("summary"), default_response["summary"])
                default_response["summary"] = (
                    raw_summary
                    if len(raw_summary) > 20 and raw_summary != text[:len(raw_summary)]
                    else default_response["summary"]
                )

                # ✅ Mots-clés — valide que c'est bien une liste de strings
                raw_keywords = llm.get("keywords", [])
                if isinstance(raw_keywords, list):
                    default_response["keywords"] = [
                        str(k).strip() for k in raw_keywords
                        if isinstance(k, str) and len(k.strip()) > 1
                    ][:10]
                elif isinstance(raw_keywords, str):
                    # Parfois le LLM retourne une string séparée par virgules
                    default_response["keywords"] = [
                        k.strip() for k in raw_keywords.split(",")
                        if k.strip()
                    ][:10]

                # Sentiment
                raw_sentiment = _safe_str(llm.get("sentiment"), "NEUTRAL").upper()
                if raw_sentiment in ("POSITIVE", "NEGATIVE", "NEUTRAL"):
                    default_response["sentiment"] = raw_sentiment

                # Champs texte
                default_response["problem"]         = _safe_str(llm.get("problem"))
                default_response["customer_intent"] = _safe_str(llm.get("customer_intent"))
                default_response["next_steps"]      = _safe_str(llm.get("next_steps"))
                default_response["appointment_date"]= _safe_str(llm.get("appointment_date"))

                # Code postal : priorité Regex, sinon LLM
                if not default_response["postal_code"]:
                    default_response["postal_code"] = _safe_str(llm.get("postal_code"))

                # Booléens
                default_response["script_respected"]   = _safe_bool(llm.get("script_respected"))
                default_response["objections_handled"] = _safe_bool(llm.get("objections_handled"))

                # Scores entiers validés
                default_response["appointment_confidence"] = _safe_int(llm.get("appointment_confidence"), 0, 0, 100)
                default_response["agent_politeness"]       = _safe_int(llm.get("agent_politeness"),       5, 1, 10)
                default_response["score_ecoute"]           = _safe_int(llm.get("score_ecoute"),           0, 0, 10)
                default_response["score_persuasion"]       = _safe_int(llm.get("score_persuasion"),       0, 0, 10)
                default_response["score_empathie"]         = _safe_int(llm.get("score_empathie"),         0, 0, 10)
                default_response["score_argumentation"]    = _safe_int(llm.get("score_argumentation"),    0, 0, 10)
                default_response["score_refus"]            = _safe_int(llm.get("score_refus"),            0, 0, 10)
                default_response["score_vente"]            = _safe_int(llm.get("score_vente"),            0, 0, 10)

                # Score de sentiment calculé depuis le label
                s = default_response["sentiment"]
                default_response["sentiment_score"] = (
                    0.9 if s == "POSITIVE" else (0.2 if s == "NEGATIVE" else 0.5)
                )

                print(f"✅ Analyse LLM réussie avec {model_name}")
                return default_response

        except Exception as e:
            print(f"Ollama LLM Failed. Using Fallback. Error: {e}")

    # ===== FALLBACK (DistilBERT + dictionnaire métier) =====
    print("Utilisation du Fallback (HuggingFace DistilBERT + dictionnaire)...")

    max_length = 500
    short_text = text[:max_length] if len(text) > max_length else text

    try:
        hf_res = sentiment_model(short_text)[0]
        default_response["sentiment"] = hf_res["label"]
        default_response["sentiment_score"] = (
            hf_res["score"] if hf_res["label"] == "POSITIVE" else (1 - hf_res["score"])
        )
    except Exception:
        pass

    # ✅ Mots-clés via dictionnaire métier (fallback)
    default_response["keywords"] = extract_keywords_fallback(text)

    # Détection plainte basique
    complaint_words = [
        "problème", "pb", "panne", "réclamation", "plainte",
        "colère", "inacceptable", "remboursement"
    ]
    lower_text = text.lower()
    for word in complaint_words:
        if word in lower_text:
            default_response["problem"] = word
            break

    return default_response


# =========================

# =========================

def _build_fallback_summary(text):
    """
    Construit un résumé de fallback intelligent (sans LLM) :
    - Prend les 2 premières phrases complètes
    - Si pas de ponctuation, tronque proprement à 200 chars
    - Ajoute "..." seulement si le texte a été tronqué
    """
    if not text:
        return ""

    # Découpe sur ponctuation forte
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    if sentences:
        # Prend les 2 premières phrases
        summary = " ".join(sentences[:2])
        if len(summary) > 250:
            summary = summary[:250].rsplit(" ", 1)[0] + "..."
        return summary

    # Pas de ponctuation détectée → tronquage propre au dernier espace
    if len(text) <= 200:
        return text
    return text[:200].rsplit(" ", 1)[0] + "..."


# =========================
# SCORE AGENT
# =========================

def calculate_final_score(metrics):
    try:
        with open("config.json", "r") as f:
            config  = json.load(f)
            weights = config.get("weights", {
                "ecoute": 20, "persuasion": 20, "empathie": 15,
                "argumentation": 15, "refus": 15, "vente": 15
            })
    except Exception:
        weights = {
            "ecoute": 20, "persuasion": 20, "empathie": 15,
            "argumentation": 15, "refus": 15, "vente": 15
        }

    # Chaque score LLM (1-10) → ramené sur 100 → pondéré
    total = 0
    total += (metrics.get("score_ecoute",        5) * 10) * (weights.get("ecoute",        20) / 100)
    total += (metrics.get("score_persuasion",     5) * 10) * (weights.get("persuasion",    20) / 100)
    total += (metrics.get("score_empathie",       5) * 10) * (weights.get("empathie",      15) / 100)
    total += (metrics.get("score_argumentation",  5) * 10) * (weights.get("argumentation", 15) / 100)
    total += (metrics.get("score_refus",          5) * 10) * (weights.get("refus",         15) / 100)
    total += (metrics.get("score_vente",          5) * 10) * (weights.get("vente",         15) / 100)

    score = total
    if metrics.get("problem"):
        score -= 10
    if metrics.get("script_respected"):
        score += 5

    score = max(0, min(score, 100))

    if score >= 80:
        performance = "Excellent"
    elif score >= 60:
        performance = "Bon"
    elif score >= 40:
        performance = "Moyen"
    else:
        performance = "A améliorer"

    return round(score, 2), performance