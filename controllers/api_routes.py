from fastapi import APIRouter
from typing import Union
import os
from services.ai import transcribe_audio, analyze_sentiment, agent_score
from models.schemas import AnalysisResponse, AnalysisError

router = APIRouter()

@router.post("/analyze_call", response_model=Union[AnalysisResponse, AnalysisError])
def analyze_call(audio_path: str):
    try:
        if not os.path.exists(audio_path):
            return AnalysisError(error="Audio file not found")

        transcription = transcribe_audio(audio_path)
        sentiment, sentiment_score = analyze_sentiment(transcription)
        score, performance = agent_score(sentiment_score)

        return AnalysisResponse(
            transcription=transcription,
            sentiment=sentiment,
            score=score,
            performance=performance
        )

    except Exception as e:
        return AnalysisError(error=str(e))
