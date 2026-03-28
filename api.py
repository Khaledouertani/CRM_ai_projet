from fastapi import FastAPI
from ai_utils import transcribe_audio, analyze_sentiment, agent_score
import os
app = FastAPI()

@app.get("/")
def home():
    return {"message": "CRM AI API running"}


@app.post("/analyze_call")
def analyze_call(audio_path: str):

    try:

        if not os.path.exists(audio_path):
            return {"error": "Audio file not found"}

        transcription = transcribe_audio(audio_path)

        sentiment, sentiment_score = analyze_sentiment(transcription)

        score, performance = agent_score(sentiment_score)

        return {
            "transcription": transcription,
            "sentiment": sentiment,
            "score": score,
            "performance": performance
        }

    except Exception as e:

        return {"error": str(e)}