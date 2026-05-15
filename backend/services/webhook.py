"""
services/webhook.py
===================
Webhook Integration - Real-time alerts from Asterisk/Aircall.

Handles incoming webhooks from:
- Asterisk (FreePBX, AsteriskNOW)
- Aircall
- Other telephony systems

Features:
- Call started/ended events
- Agent status changes
- Auto-upload audio for analysis
- Real-time alerts for supervisors
"""

import os
import hmac
import hashlib
from datetime import datetime
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


def verify_aircall_webhook(payload: bytes, signature: str) -> bool:
    """
    Vérifie la signature webhook d'Aircall.
    """
    os.getenv("AIRCALL_API_KEY")
    api_secret = os.getenv("AIRCALL_API_SECRET")
    
    if not api_secret:
        return True
    
    expected_signature = hmac.new(
        api_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)


def verify_asterisk_webhook(token: str) -> bool:
    """
    Vérifie le token webhook d'Asterisk.
    """
    expected_token = os.getenv("ASTERISK_WEBHOOK_TOKEN")
    
    if not expected_token:
        return True
    
    return token == expected_token


def parse_aircall_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse un webhook Aircall et le convertit au format standard.
    """
    event_type = data.get("event", "")
    
    parsed = {
        "source": "aircall",
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "call_id": data.get("id"),
        "direction": data.get("direction"),
        "status": data.get("status"),
        "phone_number": data.get("number", {}).get("phone_number") if isinstance(data.get("number"), dict) else data.get("number"),
        "agent_id": data.get("user", {}).get("id") if isinstance(data.get("user"), dict) else data.get("user_id"),
        "agent_name": data.get("user", {}).get("name") if isinstance(data.get("user"), dict) else data.get("user_name"),
        "duration": data.get("duration"),
        "recording_url": data.get("recording_url"),
    }
    
    return parsed


def parse_asterisk_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse un webhook Asterisk et le convertit au format standard.
    """
    parsed = {
        "source": "asterisk",
        "event_type": data.get("Event"),
        "timestamp": datetime.now().isoformat(),
        "call_id": data.get("UniqueID"),
        "direction": "inbound" if data.get("ChannelStateDesc") == "Ring" else "outbound",
        "status": data.get("ChannelStateDesc"),
        "phone_number": data.get("CallerIDNum"),
        "agent_id": data.get("Extension"),
        "agent_name": data.get("CallerIDName"),
        "duration": data.get("Duration"),
        "recording_url": data.get("RecordingFile"),
    }
    
    return parsed


def process_call_started(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traite un événement d'appel démarré.
    """
    return {
        "action": "call_started",
        "call_id": call_data.get("call_id"),
        "agent": call_data.get("agent_name"),
        "phone_number": call_data.get("phone_number"),
        "message": f"Appel {'entrants' if call_data.get('direction') == 'inbound' else 'sortants'} démarré par {call_data.get('agent_name')}"
    }


def process_call_ended(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traite un événement d'appel terminé.
    """
    duration = call_data.get("duration", 0)
    
    result = {
        "action": "call_ended",
        "call_id": call_data.get("call_id"),
        "agent": call_data.get("agent_name"),
        "duration": duration,
        "message": f"Appel terminé. Durée: {duration} secondes."
    }
    
    if duration < 30:
        result["alert"] = "Appel très court - possible problème"
        result["alert_level"] = "warning"
    
    return result


def process_call_recording(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traite un événement d'enregistrement disponible.
    """
    return {
        "action": "recording_available",
        "call_id": call_data.get("call_id"),
        "recording_url": call_data.get("recording_url"),
        "message": "Nouvel enregistrement disponible pour analyse"
    }


def process_webhook(data: Dict[str, Any], source: str = "auto") -> Dict[str, Any]:
    """
    Traite un webhook et retourne l'action recommandée.
    """
    if source == "auto":
        if "event" in data and "aircall" in str(data).lower():
            source = "aircall"
        elif "Event" in data:
            source = "asterisk"
        else:
            source = "unknown"
    
    if source == "aircall":
        parsed = parse_aircall_webhook(data)
    elif source == "asterisk":
        parsed = parse_asterisk_webhook(data)
    else:
        parsed = data
    
    event_type = parsed.get("event_type", "")
    
    if "call.started" in event_type or event_type == "call_start":
        return process_call_started(parsed)
    elif "call.ended" in event_type or event_type == "hangup":
        return process_call_ended(parsed)
    elif "call.recording.ready" in event_type or "recording" in event_type:
        return process_call_recording(parsed)
    else:
        return {
            "action": "unknown",
            "event_type": event_type,
            "message": f"Événement non reconnu: {event_type}"
        }


def get_webhook_endpoints() -> Dict[str, str]:
    """
    Retourne les endpoints webhook configurés.
    """
    base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8501")
    
    return {
        "aircall": f"{base_url}/api/webhook/aircall",
        "asterisk": f"{base_url}/api/webhook/asterisk",
        "generic": f"{base_url}/api/webhook/generic"
    }


def create_webhook_response(success: bool, message: str, data: Any = None) -> tuple:
    """
    Crée une réponse webhook standard.
    """
    response = {
        "success": success,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if data:
        response["data"] = data
    
    return jsonify(response), 200 if success else 400
