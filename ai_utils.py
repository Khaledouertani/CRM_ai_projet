import whisper
from transformers import pipeline

# Charger les modèles
whisper_model = whisper.load_model("base")
sentiment_model = pipeline("sentiment-analysis")

# =========================
# Transcription audio
# =========================

def transcribe_audio(audio_path):

    result = whisper_model.transcribe(audio_path)

    text = result["text"]

    return text


# =========================
# Analyse sentiment
# =========================

def analyze_sentiment(text):

    # limiter la taille du texte pour éviter erreur du modèle
    max_length = 500

    if len(text) > max_length:
        text = text[:max_length]

    result = sentiment_model(text)[0]

    sentiment = result["label"]
    score = result["score"]

    return sentiment, score


# =========================
# Score agent
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