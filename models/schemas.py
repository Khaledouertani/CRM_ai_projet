from pydantic import BaseModel

class AnalysisResponse(BaseModel):
    transcription: str
    sentiment: str
    score: float
    performance: str

class AnalysisError(BaseModel):
    error: str
