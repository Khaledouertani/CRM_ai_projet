"""
controllers/api_routes.py
=========================
Endpoint principal d'analyse des appels.
Intègre maintenant la diarization Agent / Client.

Accepte DEUX modes d'appel :
  1. Upload fichier (watcher automatique) :
       POST /analyze_call
       multipart/form-data : file=<binaire>, agent_name=<str>

  2. Chemin local (dashboard Streamlit - ancien mode) :
       POST /analyze_call
       form : audio_path=<str>, agent_name=<str>
"""

import os
import shutil
from datetime import datetime
from typing import Union, Optional

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

from services.ai import (
    transcribe_audio,
    analyze_transcript_with_llm,
    calculate_final_score,
    detect_inactivity,
)
from services.diarization import diarize_audio
from models.schemas import AnalysisResponse, AnalysisError

router = APIRouter()

AUDIO_SAVE_DIR = "audio"
os.makedirs(AUDIO_SAVE_DIR, exist_ok=True)


@router.post("/analyze_call", response_model=Union[AnalysisResponse, AnalysisError])
async def analyze_call(
    file:       Optional[UploadFile] = File(default=None),
    audio_path: Optional[str]        = Form(default=None),
    agent_name: Optional[str]        = Form(default="Inconnu"),
):
    """
    Pipeline complet d'analyse d'un appel :
      1. Transcription Whisper (avec timestamps de segments)
      2. Diarization Agent / Client (pyannote ou heuristique)
      3. Analyse sémantique LLM (Ollama / Llama3)
      4. Scoring pondéré
      5. Détection d'inactivité
    """

    # ── Résolution du fichier audio ────────────────────────────────────────────
    resolved_path: Optional[str] = None

    if file is not None:
        save_path = os.path.join(AUDIO_SAVE_DIR, file.filename)
        if os.path.exists(save_path):
            base, ext = os.path.splitext(file.filename)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_path = os.path.join(AUDIO_SAVE_DIR, f"{base}_{timestamp}{ext}")
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        resolved_path = save_path

    elif audio_path is not None:
        resolved_path = audio_path

    else:
        return AnalysisError(error="Aucun fichier audio fourni.")

    if not os.path.exists(resolved_path):
        return AnalysisError(error=f"Fichier introuvable : {resolved_path}")

    # ── Pipeline IA ───────────────────────────────────────────────────────────
    try:
        import whisper as _whisper

        # 1. Transcription Whisper avec segments horodatés
        #    On transcrit directement avec le modèle pour récupérer les segments
        whisper_model = _whisper.load_model("base")
        whisper_result = whisper_model.transcribe(resolved_path, verbose=False)

        transcription     = whisper_result["text"].strip()
        whisper_segments  = whisper_result.get("segments", [])

        
        diar = diarize_audio(
            audio_path=resolved_path,
            whisper_segments=whisper_segments,
            num_speakers=2,
            use_heuristic_fallback=True,   # Fonctionne même sans token HF
        )

        # Si la diarization a réussi, on analyse le texte agent séparément
        text_for_analysis = (
            diar["labeled_transcript"] if diar["diarization_success"]
            else transcription
        )

        # 3. Analyse sémantique LLM sur la transcription complète
        metrics = analyze_transcript_with_llm(transcription)

        # 4. Score final
        score, performance = calculate_final_score(metrics)

        # 5. Détection d'inactivité
        inactivity = detect_inactivity(resolved_path, silence_threshold_seconds=30)

        return AnalysisResponse(
            agent_name=agent_name,
            audio_path=resolved_path,

            # Transcription
            transcription=transcription,

            
            labeled_transcript=diar["labeled_transcript"],
            agent_text=diar["agent_text"],
            client_text=diar["client_text"],
            agent_talk_ratio=diar["agent_talk_ratio"],
            client_talk_ratio=diar["client_talk_ratio"],
            agent_seconds=diar["agent_seconds"],
            client_seconds=diar["client_seconds"],
            diarization_method=diar["method"],

            # Analyse LLM
            sentiment=metrics["sentiment"],
            score=score,
            performance=performance,
            summary=metrics["summary"],
            keywords=metrics.get("keywords", []),
            problem=metrics["problem"],
            postal_code=metrics.get("postal_code", ""),
            script_respected=metrics.get("script_respected", False),
            customer_intent=metrics.get("customer_intent", ""),
            objections_handled=metrics.get("objections_handled", False),
            agent_politeness=metrics.get("agent_politeness", 5),
            next_steps=metrics.get("next_steps", ""),

            # Inactivité
            inactivity_detected=inactivity["inactivity_detected"],
            inactivity_duration=inactivity.get("inactivity_duration", 0.0),
        )

    except Exception as e:
        return AnalysisError(error=f"Erreur pipeline : {str(e)}")


@router.get("/status")
def status():
    return {
        "status":    "ok",
        "timestamp": datetime.now().isoformat(),
        "audio_dir": os.path.abspath(AUDIO_SAVE_DIR),
    }