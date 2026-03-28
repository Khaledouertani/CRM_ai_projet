import whisper
from transformers import pipeline

# =========================
# CHARGEMENT DES MODELES
# =========================

print("Chargement des modèles IA...")

whisper_model = whisper.load_model("base")

sentiment_model = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

print("Modèles chargés")

# =========================
# TRANSCRIPTION AUDIO
# =========================

def transcribe_audio(audio_path):

    try:

        result = whisper_model.transcribe(audio_path)

        text = result["text"]

        return text.strip()

    except Exception as e:

        print("Erreur transcription :", e)

        return ""


# =========================
# ANALYSE SENTIMENT
# =========================

def analyze_sentiment(text):

    try:

        # limiter taille texte
        max_length = 500

        if len(text) > max_length:
            text = text[:max_length]

        result = sentiment_model(text)[0]

        sentiment = result["label"]
        score = result["score"]

        return sentiment, score

    except Exception as e:

        print("Erreur sentiment :", e)

        return "UNKNOWN", 0


# =========================
# SCORE AGENT
# =========================

def agent_score(sentiment_score):

    score = sentiment_score * 100

    if score >= 80:
        performance = "Excellent"

    elif score >= 60:
        performance = "Bon"

    elif score >= 40:
        performance = "Moyen"

    else:
        performance = "A améliorer"

    return score, performance


# =========================
# DETECTION PLAINTE CLIENT
# =========================

def detect_complaint(text):

    keywords = [
        "problem",
        "issue",
        "complaint",
        "not happy",
        "bad service",
        "angry",
        "unsatisfied",
        "refund"
    ]

    text = text.lower()

    for word in keywords:

        if word in text:

            return True

    return False


# =========================
# SCORE QUALITE APPEL
# =========================

def call_quality_score(sentiment_score, transcription):

    score = 50

    # sentiment client
    score += sentiment_score * 30

    # pénalité plainte
    if detect_complaint(transcription):

        score -= 20

    # bonus conversation longue
    if len(transcription) > 200:

        score += 10

    score = max(0, min(score, 100))

    return score