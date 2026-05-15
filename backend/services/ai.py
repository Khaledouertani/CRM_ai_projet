import os
import random
from datetime import datetime
from typing import Optional

# FFmpeg path - ajouter au PATH Windows
FFMPEG_DIR = r"C:\Users\HP ELITEBOOK 840 G8\Downloads\ffmpeg-8.1-essentials_build\ffmpeg-8.1-essentials_build\bin"
if os.path.exists(FFMPEG_DIR):
    os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")
    print(f"FFmpeg ajouté au PATH: {FFMPEG_DIR}")
else:
    print(f"FFmpeg introuvable: {FFMPEG_DIR}")

# Try to import whisper, else use mock
WHISPER_AVAILABLE = False

try:
    import whisper
    WHISPER_AVAILABLE = True
    print("Chargement Whisper...")
    whisper_model = whisper.load_model("base")
except ImportError as e:
    print(f"Whisper non disponible: {e}")
    WHISPER_AVAILABLE = False
except Exception as e:
    print(f"Erreur chargement Whisper: {e}")
    WHISPER_AVAILABLE = False

# Try torchaudio for MP3 support (no ffmpeg needed)
TORCHAUDIO_AVAILABLE = False
try:
    import torchaudio
    TORCHAUDIO_AVAILABLE = True
    print("torchaudio disponible")
except ImportError:
    print("torchaudio non disponible")

# Try soundfile for audio loading (no ffmpeg needed)
SOUNDFILE_AVAILABLE = False
try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
    print("soundfile disponible")
except ImportError:
    print("soundfile non disponible")

def transcribe_audio(audio_path: str) -> dict:
    """
    Transcrit un fichier audio avec Whisper.
    Retourne {text, segments}
    """
    print(f"Transcription called with: {audio_path}")
    print(f"File exists: {os.path.exists(audio_path) if audio_path else False}")
    
    # Check if file exists
    if not audio_path or not os.path.exists(audio_path):
        print("Using mock transcription - file not found")
        return get_mock_transcription()
    
    if not WHISPER_AVAILABLE:
        print("Using mock transcription - Whisper not available")
        return get_mock_transcription()
    
    try:
        # Whisper directly - now with FFmpeg in PATH
        print(f"Running Whisper on: {audio_path}")
        result = whisper_model.transcribe(audio_path, fp16=False, language="fr")
        
        print(f"Whisper result: {result['text'][:100]}...")
        return {"text": result["text"], "segments": result.get("segments", [])}
    except Exception as e:
        print(f"Whisper error: {e}")
        import traceback
        traceback.print_exc()
        print("Using mock transcription as fallback")
        return get_mock_transcription()

def get_mock_transcription():
    """Retourne une transcription mock pour démo"""
    return {
        "text": """[Agent] Bonjour Madame Martin, je suis du Centre de l'Énergie.
[Client] Bonjour, je vous écoute.
[Agent] Vous avez fait une demande pour les panneaux solaires ?
[Client] Oui, je voulais connaître le prix.
[Agent] C'est gratuit selon vos revenus. Seriez-vous disponible demain ?
[Client] Oui, je serais disponible à 14h.
[Agent] Parfait, je vous mets un RDV pour demain 14h.""",
        "segments": [
            {"start": 0, "end": 5, "text": "Bonjour Madame Martin, je suis du Centre de l'Énergie."},
            {"start": 5, "end": 12, "text": "Bonjour, je vous écoute."},
            {"start": 12, "end": 25, "text": "Vous avez fait une demande pour les panneaux solaires ?"},
            {"start": 25, "end": 35, "text": "Oui, je voulais connaître le prix."},
            {"start": 35, "end": 50, "text": "C'est gratuit selon vos revenus. Seriez-vous disponible demain ?"},
            {"start": 50, "end": 60, "text": "Oui, je serais disponible à 14h."},
            {"start": 60, "end": 70, "text": "Parfait, je vous mets un RDV pour demain 14h."}
        ]
    }
def analyze_transcript_with_llm(transcription: dict, agent_name: str = "Agent") -> dict:
    import requests
    import json
    import re

    try:
        # ✅ Check Ollama
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code != 200:
            raise Exception("Ollama not available")

        text = transcription.get("text", "")[:800]

        # ✅ Strong prompt
        prompt = f"""
Return ONLY a valid JSON. No text before or after.

Format:
{{
  "sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
  "sentiment_score": number (0-1),
  "score_ecoute": number (0-10),
  "score_persuasion": number (0-10),
  "score_empathie": number (0-10),
  "score_argumentation": number (0-10),
  "score_refus": number (0-10),
  "score_vente": number (0-10),
  "summary": "short sentence",
  "keywords": ["word1", "word2", "word3"]
}}

Transcript:
{text}
"""

        # ✅ Call Ollama
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": CONFIG.get("llm", {}).get("model", "gemma3:4b"),
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": CONFIG.get("llm", {}).get("temperature", 0.2),
                    "num_predict": 100
                }
            },
            timeout=CONFIG.get("llm", {}).get("timeout", 60)
        )

        if ollama_response.status_code != 200:
            raise Exception("Ollama request failed")

        result = ollama_response.json().get("response", "")
        print("RAW LLM:", result)

        # ✅ Extract JSON safely
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group())
                print("PARSED:", parsed)

                # ✅ ضمان كل fields موجودين
                return {
                    "sentiment": parsed.get("sentiment", "NEUTRAL"),
                    "sentiment_score": parsed.get("sentiment_score", 0.5),
                    "summary": parsed.get("summary", ""),
                    "keywords": parsed.get("keywords", []),
                    "score_ecoute": parsed.get("score_ecoute", 5),
                    "score_persuasion": parsed.get("score_persuasion", 5),
                    "score_empathie": parsed.get("score_empathie", 5),
                    "score_argumentation": parsed.get("score_argumentation", 5),
                    "score_refus": parsed.get("score_refus", 5),
                    "score_vente": parsed.get("score_vente", 5)
                }

            except Exception as e:
                print("JSON parse error:", e)

        raise Exception("No valid JSON found")

    except Exception as e:
        print("LLM ERROR:", e)

    # 🔁 fallback (stable)
    print("Using fallback analysis")

    return {
        "sentiment": "NEUTRAL",
        "sentiment_score": 0.5,
        "summary": "Analyse indisponible",
        "keywords": ["appel", "client"],
        "score_ecoute": 5,
        "score_persuasion": 5,
        "score_empathie": 5,
        "score_argumentation": 5,
        "score_refus": 5,
        "score_vente": 5
    }

def calculate_final_score(scores: dict, weights: dict) -> dict:
    """
    Calcule le score final avec les pondérations.
    """
    total = 0
    for criterion, weight in weights.items():
        total += scores.get(f"score_{criterion}", 0) * (weight / 100)
    
    performance = "Excellent" if total >= 8 else "Bon" if total >= 6 else "À améliorer"
    
    return {
        "score_percentage": round(total * 10, 1),
        "performance": performance
    }

def detect_inactivity(segments: list, threshold_seconds: int = 30) -> list:
    """
    Détecte les périodes d'inactivité dans l'appel.
    """
    inactivity = []
    if not segments:
        return []
    
    for i in range(len(segments) - 1):
        gap = segments[i+1]["start"] - segments[i]["end"]
        if gap > threshold_seconds:
            inactivity.append({
                "start": segments[i]["end"],
                "end": segments[i+1]["start"],
                "duration": gap
            })
    
    return inactivity

def parse_llm_response(response: str) -> dict:
    """Parse la réponse LLM en dict"""
    import re
    result = {}
    
    # Extract sentiment
    sentiment_match = re.search(r'"sentiment":\s*(\w+)', response)
    if sentiment_match:
        result["sentiment"] = sentiment_match.group(1)
    
    # Extract scores
    for key in ["score_ecoute", "score_persuasion", "score_empathie", "score_argumentation", "score_refus", "score_vente"]:
        match = re.search(rf'"{key}":\s*(\d+)', response)
        if match:
            result[key] = int(match.group(1))
    
    # Extract summary
    summary_match = re.search(r'"summary":\s*"([^"]+)"', response)
    if summary_match:
        result["summary"] = summary_match.group(1)
    
    return result


# ============================================
# AJOUTS POUR CAHIER DES CHARGES
# ============================================

# ============================================
# AJOUTS POUR CAHIER DES CHARGES
# ============================================

import json
import os
import re as re_module
import requests as requests_module
from typing import Dict, List, Tuple, Optional

# Chemin absolu vers config.json (racine du projet)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

WEIGHTS = CONFIG["weights"]


def calculate_weighted_score(scores: Dict[str, int]) -> Tuple[float, str]:
    total = 0
    for criterion, weight in WEIGHTS.items():
        score = scores.get(criterion, 0)
        total += (score * weight) / 100
    final_score = total * 10
    
    if final_score >= 90:
        performance = "Excellent"
    elif final_score >= 75:
        performance = "Bon"
    elif final_score >= 60:
        performance = "Moyen"
    else:
        performance = "A ameliorer"
    
    return round(final_score, 1), performance


def generate_summary(text: str, ollama_url: str = "http://localhost:11434") -> str:
    try:
        prompt = f"""Resume cet appel en 2-3 phrases. Mentionne: sujet, sentiment, action cle.
        Transcription: {text[:2000]}
        Resume:"""
        response = requests_module.post(
            f"{ollama_url}/api/generate",
            json={"model": CONFIG.get("llm", {}).get("model", "gemma3:4b"), "prompt": prompt, "stream": False},
            timeout=30
        )
        if response.status_code == 200:
            summary = response.json().get("response", "").strip()
            return summary[:300]
    except Exception as e:
        print(f"Erreur resume LLM: {e}")
    return text[:150] + "..." if len(text) > 150 else text


def extract_keywords(text: str) -> List[str]:
    try:
        prompt = f"""Extrais 5 mots-cles de cette transcription. Reponds JSON: ["mot1", "mot2", ...]
        Texte: {text[:1500]}"""
        response = requests_module.post(
            "http://localhost:11434/api/generate",
            json={"model": CONFIG.get("llm", {}).get("model", "gemma3:4b"), "prompt": prompt, "stream": False},
            timeout=20
        )
        if response.status_code == 200:
            result = response.json().get("response", "")
            match = re_module.search(r'\[.*?\]', result)
            if match:
                return json.loads(match.group())
    except Exception as e:
        print(f"Erreur mots-cles: {e}")
    
    stop_words = {"le", "la", "les", "un", "une", "des", "et", "ou", "mais", "donc", "car"}
    words = re_module.findall(r'\b\w+\b', text.lower())
    word_freq = {}
    for w in words:
        if len(w) > 3 and w not in stop_words:
            word_freq[w] = word_freq.get(w, 0) + 1
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:5]]


def check_script_compliance(transcript: str, script_reference: str = None) -> Tuple[bool, str]:
    if not script_reference:
        script_reference = "bonjour presentation societe besoin client proposition rdv"
    script_keywords = script_reference.lower().split()
    transcript_lower = transcript.lower()
    missing = [kw for kw in script_keywords if kw not in transcript_lower]
    compliance = len(missing) == 0
    details = f"Manquants: {', '.join(missing)}" if missing else "Script respecte"
    return compliance, details


def detect_objections(text: str) -> Tuple[bool, List[str]]:
    objections_patterns = [
        "trop cher", "pas le budget", "pas interesse", "deja client",
        "pas le moment", "pas le temps", "je reflechis", "je dois en parler",
        "mon conjoint", "mon mari", "ma femme", "pas de projet"
    ]
    objections_found = [p for p in objections_patterns if p in text.lower()]
    objections_handled = len(objections_found) > 0
    return objections_handled, objections_found


def extract_postal_code(text: str) -> Optional[str]:
    match = re_module.search(r'\b\d{5}\b', text)
    return match.group() if match else None


def analyze_appointment(text: str) -> Tuple[Optional[str], int]:
    date_patterns = [
        r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
        r'\b\d{1,2}-\d{1,2}-\d{2,4}\b',
        r'\blundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche\b',
        r'\b(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b',
        r'\b\d{1,2}\s*h\s*\d{0,2}\b',
        r'\b(?:matin|apres-midi|soir)\b'
    ]
    rdv_keywords = ["rendez-vous", "rdv", "se voir", "se retrouver", "venir", "passer"]
    has_rdv = any(kw in text.lower() for kw in rdv_keywords)
    date_matches = sum(1 for p in date_patterns if re_module.search(p, text, re_module.IGNORECASE))
    
    if has_rdv and date_matches >= 2:
        confidence = min(70 + date_matches * 10, 100)
        return "Date detectee dans transcription", confidence
    elif has_rdv and date_matches >= 1:
        return "Date partielle", 50
    elif has_rdv:
        return "RDV sans date", 30
    return None, 0


def anonymize_text(text: str) -> str:
    text = re_module.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '****-****-****-****', text)
    text = re_module.sub(r'\b0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}\b', '0X XX XX XX XX', text)
    text = re_module.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***', text)
    return text


def check_qualification_coherence(qualification: str, transcript: str) -> Tuple[bool, str]:
    transcript_lower = transcript.lower()
    coherence_rules = {
        "RDV1": ["rdv", "rendez-vous", "venir", "passer", "date", "heure"],
        "RDV2": ["rdv", "rendez-vous", "deuxieme", "revenir"],
        "RAPPEL": ["rappel", "rappellerai", "telephonerai"],
        "REFUS_NON_INTERESSE": ["pas interesse", "ne veux pas"],
        "REFUS_COUPLE": ["conjoint", "mari", "femme", "ensemble"],
        "REFUS_CONSO": ["consommation", "pas cher"],
        "REFUS_PROJET": ["pas de projet", "pas prevu"],
        "HORS_CIBLE": ["pas eligible", "pas concerne"],
        "RDV_ANNULE": ["annule", "annulation"],
        "REPONDEUR": ["repondeur", "boite vocale"]
    }
    expected = coherence_rules.get(qualification, [])
    if not expected:
        return True, "Qualification non reconnue"
    matches = sum(1 for kw in expected if kw in transcript_lower)
    if matches >= 1:
        return True, f"Coherence OK ({matches} mots-cles)"
    return False, "INCOHERENCE: Aucun mot-cle attendu trouve"


def generate_planning_recommendations(hourly_data: dict) -> List[str]:
    recommendations = []
    if hourly_data:
        best = max(hourly_data.items(), key=lambda x: x[1])
        worst = min(hourly_data.items(), key=lambda x: x[1])
        recommendations.append(f"Creneau {best[0]}h: volume max ({best[1]} appels). Renforcez.")
        recommendations.append(f"Creneau {worst[0]}h: volume min ({worst[1]} appels). Reduisez.")
    return recommendations