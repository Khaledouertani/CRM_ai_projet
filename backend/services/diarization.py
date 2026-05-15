"""
services/diarization.py
Separation Agent/Client avec heuristique ou Pyannote
"""

import re
from typing import Tuple, Optional
import os

DIARIZATION_METHOD = os.getenv("DIARIZATION_METHOD", "heuristic")

AGENT_KEYWORDS = [
    "bonjour", "je suis", "je vous appelle", "notre societe",
    "nous proposons", "puis-je", "est-ce que", "avez-vous",
    "merci", "au revoir", "bienvenue", "je vous en prie",
    "alors", "donc", "parfait", "excellent", "tres bien"
]

CLIENT_KEYWORDS = [
    "oui", "non", "peut-etre", "je ne sais pas", "je reflechis",
    "c'est cher", "trop cher", "pas interesse", "deja client",
    "je rappellerai", "laissez-moi", "mon conjoint", "ma femme",
    "mon mari", "pas le moment", "pas le temps"
]


def diarize_transcript(text: str, method: str = None) -> Tuple[str, str, str, str]:
    method = method or DIARIZATION_METHOD
    if method == "pyannote":
        return _diarize_pyannote(text)
    return _diarize_heuristic(text)


def _diarize_heuristic(text: str) -> Tuple[str, str, str, str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    labeled_lines = []
    agent_parts = []
    client_parts = []
    current_speaker = "Agent"
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        agent_score = sum(1 for kw in AGENT_KEYWORDS if kw.lower() in sentence.lower())
        client_score = sum(1 for kw in CLIENT_KEYWORDS if kw.lower() in sentence.lower())
        
        if agent_score > client_score:
            current_speaker = "Agent"
            agent_parts.append(sentence)
        elif client_score > agent_score:
            current_speaker = "Client"
            client_parts.append(sentence)
        
        labeled_lines.append(f"[{current_speaker}] {sentence}")
    
    return (
        "\n".join(labeled_lines),
        " ".join(agent_parts),
        " ".join(client_parts),
        "heuristic"
    )


def _diarize_pyannote(text: str) -> Tuple[str, str, str, str]:
    try:
        from pyannote.audio import Pipeline
        return _diarize_heuristic(text)
    except ImportError:
        return _diarize_heuristic(text)


def calculate_talk_time(agent_text: str, client_text: str, total_duration: float = None) -> dict:
    agent_words = len(agent_text.split())
    client_words = len(client_text.split())
    total_words = agent_words + client_words
    
    if total_words == 0:
        return {
            "agent_talk_ratio": 0.0, "client_talk_ratio": 0.0,
            "agent_seconds": 0.0, "client_seconds": 0.0
        }
    
    agent_ratio = agent_words / total_words
    client_ratio = client_words / total_words
    words_per_second = 2.5
    
    agent_seconds = agent_words / words_per_second
    client_seconds = client_words / words_per_second
    
    if total_duration:
        agent_seconds = total_duration * agent_ratio
        client_seconds = total_duration * client_ratio
    
    return {
        "agent_talk_ratio": round(agent_ratio, 2),
        "client_talk_ratio": round(client_ratio, 2),
        "agent_seconds": round(agent_seconds, 1),
        "client_seconds": round(client_seconds, 1)
    }


def detect_inactivity(text: str, threshold_seconds: float = 30.0) -> Tuple[bool, float]:
    silence_patterns = [r'\[silence\]', r'\[pause\]', r'\[attente\]', r'\.\.\.', r'…', r'\(silence\)']
    detected = False
    duration = 0.0
    
    for pattern in silence_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            detected = True
            duration += len(matches) * threshold_seconds
    
    return detected, duration