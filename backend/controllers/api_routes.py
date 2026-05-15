from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import shutil
from datetime import datetime
import json
from models.database import insert_call

from services.ai import (
    transcribe_audio,
    analyze_transcript_with_llm,
    calculate_final_score,
    detect_inactivity
)
from services.diarization import diarize_transcript
try:
    from services.followup import determine_followup
    from services.rgpd import check_rgpd_compliance
except ImportError:
    def determine_followup(analysis, scoring):
        return {"priority": "normal", "actions": ["Suivi standard"], "next_contact": None, "notes": ""}
    def check_rgpd_compliance(transcription):
        return {"compliant": True, "issues": [], "checked_at": None}

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

AUDIO_SAVE_DIR = "audio"
os.makedirs(AUDIO_SAVE_DIR, exist_ok=True)

# Make path absolute
AUDIO_SAVE_DIR = os.path.abspath(AUDIO_SAVE_DIR)
print(f"Audio directory: {AUDIO_SAVE_DIR}")

# Load weights from config
def load_weights():
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
            return config.get("weights", {
                "ecoute": 20, "persuasion": 20, "empathie": 15,
                "argumentation": 15, "refus": 15, "vente": 15
            })
    except:
        return {"ecoute": 20, "persuasion": 20, "empathie": 15,
                "argumentation": 15, "refus": 15, "vente": 15}

@router.post("/call")
async def analyze_call(
    file: Optional[UploadFile] = File(default=None),
    audio_path: Optional[str] = Form(default=None),
    agent_name: Optional[str] = Form(default="Inconnu"),
):
    resolved_path = None

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

    if not resolved_path or not os.path.exists(resolved_path):
        raise HTTPException(status_code=400, detail="Fichier audio non trouvé")

    try:
        # =========================
        # 1. TRANSCRIPTION
        # =========================
        transcription = transcribe_audio(resolved_path)

        # =========================
        # 2. DIARIZATION
        # =========================
        try:
            diarized_tuple = diarize_transcript(transcription.get("text", ""))
            labeled_lines = diarized_tuple[0]
            agent_text = diarized_tuple[1]
            client_text = diarized_tuple[2]
        except Exception as e:
            labeled_lines = transcription.get("text", "")
            agent_text = ""
            client_text = transcription.get("text", "")

        from services.diarization import calculate_talk_time
        talk_time = calculate_talk_time(agent_text, client_text)

        # =========================
        # 3. ANALYSE LLM
        # =========================
        analysis = analyze_transcript_with_llm(transcription, agent_name)

        # =========================
        # 4. SCORING
        # =========================
        weights = load_weights()

        scores = {
            "ecoute": analysis.get("score_ecoute", 0),
            "persuasion": analysis.get("score_persuasion", 0),
            "empathie": analysis.get("score_empathie", 0),
            "argumentation": analysis.get("score_argumentation", 0),
            "refus": analysis.get("score_refus", 0),
            "vente": analysis.get("score_vente", 0)
        }

        scoring = calculate_final_score(scores, weights)

        # =========================
        # 5. INACTIVITY
        # =========================
        inactivity = detect_inactivity(transcription.get("segments", []), 30)
        inactivity_detected = len(inactivity) > 0
        inactivity_duration = sum([inc.get("duration", 0) for inc in inactivity])

        # =========================
        # 6. FOLLOWUP
        # =========================
        followup = determine_followup(analysis, scoring)

        # =========================
        # 7. RGPD
        # =========================
        rgpd = check_rgpd_compliance(transcription.get("text", ""))

        # =========================
        # 🔥 KEYWORDS FIX
        # =========================
        keywords = analysis.get("keywords", [])
        if isinstance(keywords, str):
            keywords = keywords.split(",")

        # =========================
        # 🔥 SAVE TO DATABASE (FIX PRINCIPAL)
        # =========================
        insert_call({
            "agent_name": agent_name,
            "audio_file": resolved_path,
            "transcription": transcription.get("text", ""),

            "sentiment": analysis.get("sentiment"),
            "sentiment_score": analysis.get("sentiment_score"),

            "summary": analysis.get("summary"),
            "keywords": json.dumps(keywords),

            "score_percentage": scoring.get("score_percentage"),
            "performance": scoring.get("performance"),

            "score_ecoute": scores.get("ecoute"),
            "score_persuasion": scores.get("persuasion"),
            "score_empathie": scores.get("empathie"),
            "score_argumentation": scores.get("argumentation"),
            "score_refus": scores.get("refus"),
            "score_vente": scores.get("vente"),

            "call_date": datetime.now()
        })

        # =========================
        # RETURN API RESPONSE
        # =========================
        return {
            "agent_name": agent_name,
            "audio_path": resolved_path,
            "transcription": transcription.get("text", ""),
            "transcript_segments": diarized_tuple if 'diarized_tuple' in locals() else [],
            "labeled_transcript": labeled_lines,

            "sentiment": analysis.get("sentiment", "NEUTRAL"),
            "sentiment_score": analysis.get("sentiment_score", 0.5),

            "score": scoring.get("score_percentage", 0),
            "score_percentage": scoring.get("score_percentage", 0),
            "performance": scoring.get("performance", ""),

            "summary": analysis.get("summary", ""),
            "keywords": keywords,

            "score_ecoute": scores.get("ecoute", 0),
            "score_persuasion": scores.get("persuasion", 0),
            "score_empathie": scores.get("empathie", 0),
            "score_argumentation": scores.get("argumentation", 0),
            "score_refus": scores.get("refus", 0),
            "score_vente": scores.get("vente", 0),

            "agent_talk_ratio": talk_time.get("agent_talk_ratio", 0.6),
            "client_talk_ratio": talk_time.get("client_talk_ratio", 0.4),

            "inactivity_periods": inactivity,
            "inactivity_detected": inactivity_detected,
            "inactivity_duration": int(inactivity_duration),
            
            "script_respected": analysis.get("score_argumentation", 0) >= 5,
            "qualification_match": analysis.get("score_ecoute", 0) >= 5,
            "refusal_reason": None if analysis.get("score_refus", 0) < 5 else "Objection prix détectée",
            "agent_politeness": analysis.get("score_empathie", 0),
            "next_steps": "Travailler la découverte des besoins client" if analysis.get("score_persuasion", 0) < 6 else "Maintenir cette approche empathique",

            "followup": followup,
            "rgpd_compliance": rgpd,
            "call_date": datetime.now().isoformat()
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# AJOUTS POUR CAHIER DES CHARGES
# ============================================

from datetime import date
from typing import Optional
from fastapi import APIRouter

from services.attendance import (
    get_first_last_call, calculate_productive_time,
    check_attendance, get_team_attendance
)
from services.rgpd import anonymize_transcript, log_action, get_audit_trail
from services.ai import check_qualification_coherence, analyze_appointment

# Nouveau router pour les endpoints additionnels
router2 = APIRouter(prefix="/api", tags=["extra"])


@router2.get("/attendance/{agent_id}")
def get_agent_attendance(agent_id: str, target_date: Optional[date] = None):
    first, last = get_first_last_call(agent_id, target_date)
    return {
        "agent_id": agent_id,
        "first_call": first.isoformat() if first else None,
        "last_call": last.isoformat() if last else None,
        "date": (target_date or date.today()).isoformat()
    }


@router2.post("/attendance/check")
def check_agent_attendance(data: dict):
    result = check_attendance(
        data["agent_id"], data["scheduled_start"],
        data["scheduled_end"], data.get("target_date")
    )
    return result


@router2.get("/attendance/team/{target_date}")
def team_attendance(target_date: date):
    return get_team_attendance(target_date)


@router2.post("/qualification/check")
def qualification_check(data: dict):
    coherent, details = check_qualification_coherence(data["qualification"], data["transcript"])
    return {"coherent": coherent, "details": details}


@router2.post("/appointment/detect")
def appointment_detect(data: dict):
    date_detected, confidence = analyze_appointment(data["transcript"])
    return {
        "detected": date_detected is not None,
        "date": date_detected,
        "confidence": confidence,
        "requires_validation": True
    }


@router2.post("/transcript/anonymize")
def anonymize(data: dict):
    return {"anonymized": anonymize_transcript(data["transcript"])}


@router2.get("/audit-trail")
def audit_trail(user_id: Optional[str] = None, days: int = 30):
    return get_audit_trail(user_id, days)