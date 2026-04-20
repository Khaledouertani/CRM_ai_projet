"""
models/schemas.py
=================
Modèles Pydantic v2 de validation pour l'API FastAPI.
"""

import json as _json
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# RÉPONSE D'ANALYSE (succès)
# =============================================================================

class AnalysisResponse(BaseModel):

    # ── Identification ─────────────────────────────────────────────────────────
    agent_name: str  = Field(default="Inconnu", description="Nom de l'agent")
    audio_path: str  = Field(default="",        description="Chemin fichier audio")

    # ── Transcription ──────────────────────────────────────────────────────────
    transcription: str = Field(..., description="Transcription complète (Whisper)")

    # ── Diarization ────────────────────────────────────────────────────────────
    labeled_transcript: str   = Field(default="",    description="Transcription [Agent]/[Client]")
    agent_text:         str   = Field(default="",    description="Paroles agent uniquement")
    client_text:        str   = Field(default="",    description="Paroles client uniquement")
    agent_talk_ratio:   float = Field(default=0.0,   ge=0.0, le=1.0)
    client_talk_ratio:  float = Field(default=0.0,   ge=0.0, le=1.0)
    agent_seconds:      float = Field(default=0.0,   ge=0.0)
    client_seconds:     float = Field(default=0.0,   ge=0.0)
    diarization_method: str   = Field(default="none", description="pyannote | heuristic | none")

    # ── Analyse sémantique ─────────────────────────────────────────────────────
    sentiment:       str = Field(..., description="POSITIVE | NEGATIVE | NEUTRAL")
    summary:         str = Field(..., description="Résumé 2-3 phrases")
    problem:         str = Field(..., description="Problème ou réclamation détecté")
    postal_code:     str = Field(..., description="Code postal extrait")
    customer_intent: str = Field(..., description="Intention client : RDV client 1, Refus...")
    next_steps:      str = Field(..., description="Prochaine action recommandée")

    # ── Mots-clés ──────────────────────────────────────────────────────────────
    keywords: List[str] = Field(default_factory=list, description="5-8 mots-clés métier")

    # ── Évaluation agent ──────────────────────────────────────────────────────
    score:              float = Field(...,     ge=0,  le=100)
    performance:        str   = Field(...,     description="Excellent | Bon | Moyen | A améliorer")
    script_respected:   bool  = Field(...)
    objections_handled: bool  = Field(...)
    agent_politeness:   int   = Field(...,     ge=1,  le=10)

    # ── Scores individuels ─────────────────────────────────────────────────────
    score_ecoute:        int = Field(default=0, ge=0, le=10)
    score_persuasion:    int = Field(default=0, ge=0, le=10)
    score_empathie:      int = Field(default=0, ge=0, le=10)
    score_argumentation: int = Field(default=0, ge=0, le=10)
    score_refus:         int = Field(default=0, ge=0, le=10)
    score_vente:         int = Field(default=0, ge=0, le=10)

    # ── Rendez-vous ────────────────────────────────────────────────────────────
    appointment_date:       str = Field(default="", description="Date/heure RDV")
    appointment_confidence: int = Field(default=0,  ge=0, le=100)

    # ── Inactivité ─────────────────────────────────────────────────────────────
    inactivity_detected: bool  = Field(default=False)
    inactivity_duration: float = Field(default=0.0, ge=0.0)

    # ── Validateurs ────────────────────────────────────────────────────────────

    @field_validator("sentiment", mode="before")
    @classmethod
    def sentiment_valid(cls, v):
        v = str(v).upper().strip()
        return v if v in {"POSITIVE", "NEGATIVE", "NEUTRAL"} else "NEUTRAL"

    @field_validator("diarization_method", mode="before")
    @classmethod
    def diarization_method_valid(cls, v):
        return v if v in {"pyannote", "heuristic", "none"} else "none"

    @field_validator("score", mode="before")
    @classmethod
    def score_clamp(cls, v):
        return round(max(0.0, min(float(v), 100.0)), 2)

    @field_validator("agent_talk_ratio", "client_talk_ratio", mode="before")
    @classmethod
    def ratio_clamp(cls, v):
        return round(max(0.0, min(float(v), 1.0)), 3)

    @field_validator("keywords", mode="before")
    @classmethod
    def keywords_normalize(cls, v):
        if isinstance(v, list):
            return [str(k).strip() for k in v if str(k).strip()][:10]
        if isinstance(v, str):
            try:
                parsed = _json.loads(v)
                if isinstance(parsed, list):
                    return [str(k).strip() for k in parsed if str(k).strip()][:10]
            except Exception:
                pass
            return [k.strip() for k in v.split(",") if k.strip()][:10]
        return []


# =============================================================================
# RÉPONSE D'ERREUR
# =============================================================================

class AnalysisError(BaseModel):
    error: str = Field(..., description="Message d'erreur")


# =============================================================================
# RÉSUMÉ AGENT (dashboard supervision)
# =============================================================================

class AgentSummary(BaseModel):
    agent_name:      str   = Field(...)
    total_calls:     int   = Field(...,  ge=0)
    avg_score:       float = Field(...,  ge=0, le=100)
    positive_calls:  int   = Field(default=0, ge=0)
    negative_calls:  int   = Field(default=0, ge=0)
    neutral_calls:   int   = Field(default=0, ge=0)
    avg_agent_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    rdv_count:       int   = Field(default=0, ge=0)
    refus_count:     int   = Field(default=0, ge=0)
    alert:           bool  = Field(default=False)


# =============================================================================
# RÉSUMÉ APPEL (listes Streamlit)
# =============================================================================

class CallSummary(BaseModel):
    call_id:             int   = Field(...)
    agent_name:          str   = Field(...)
    call_time:           str   = Field(...)
    score:               float = Field(..., ge=0, le=100)
    performance:         str   = Field(...)
    sentiment:           str   = Field(...)
    customer_intent:     str   = Field(default="")
    summary:             str   = Field(default="")
    inactivity_detected: bool  = Field(default=False)
    diarization_method:  str   = Field(default="none")