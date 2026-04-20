"""
services/diarization.py
========================
Diarization Agent / Client pour le CRM IA.

Sépare automatiquement la voix de l'agent et du client dans
un enregistrement audio, puis fusionne avec la transcription Whisper
pour produire une transcription étiquetée.

Prérequis :
    pip install pyannote.audio torch

Token HuggingFace OBLIGATOIRE (gratuit) :
    1. Crée un compte sur https://huggingface.co
    2. Accepte les conditions du modèle :
       https://huggingface.co/pyannote/speaker-diarization-3.1
    3. Génère un token : https://huggingface.co/settings/tokens
    4. Ajoute dans ton .env : HF_TOKEN=hf_xxxxxxxxxxxx

Usage depuis api_routes.py :
    from services.diarization import diarize_audio

    result = diarize_audio("audio/mon_fichier.mp3", whisper_segments)
    # result["labeled_transcript"]  → transcription avec [Agent] / [Client]
    # result["agent_text"]          → paroles de l'agent uniquement
    # result["client_text"]         → paroles du client uniquement
    # result["agent_talk_ratio"]    → % de temps de parole agent (float)
    # result["client_talk_ratio"]   → % de temps de parole client (float)
    # result["diarization_success"] → True si pyannote a fonctionné
"""

import os
import re
import json
import time
import logging
from collections import defaultdict
from pathlib import Path
from typing import Optional

log = logging.getLogger("diarization")

# ── Token HuggingFace ──────────────────────────────────────────────────────────
# Chargé depuis .env ou variable d'environnement
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# Cache du pipeline (chargé une seule fois en mémoire)
_pipeline = None


# =============================================================================
# CHARGEMENT DU PIPELINE PYANNOTE
# =============================================================================

def _load_pipeline():
    """
    Charge le pipeline pyannote speaker-diarization-3.1 une seule fois.
    Stocké en variable globale pour éviter de recharger à chaque appel.

    Retourne le pipeline ou None si le chargement échoue.
    """
    global _pipeline

    if _pipeline is not None:
        return _pipeline

    if not HF_TOKEN:
        log.warning(
            "HF_TOKEN manquant. Impossible de charger pyannote.\n"
            "→ Ajoute HF_TOKEN=hf_xxxx dans ton fichier .env\n"
            "→ Token gratuit sur https://huggingface.co/settings/tokens"
        )
        return None

    try:
        from pyannote.audio import Pipeline
        import torch

        log.info("Chargement du pipeline pyannote (premier appel, ~30s)...")
        t0 = time.time()

        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN
        )

        # Utilise le GPU si disponible, sinon CPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            import torch
            _pipeline = _pipeline.to(torch.device("cuda"))
            log.info(f"Pyannote sur GPU (CUDA)")
        else:
            log.info("Pyannote sur CPU (plus lent, ~1-3 min par fichier)")

        log.info(f"Pipeline pyannote chargé en {time.time()-t0:.1f}s")
        return _pipeline

    except ImportError:
        log.error("pyannote.audio non installé → pip install pyannote.audio")
        return None

    except Exception as e:
        log.error(f"Échec chargement pipeline pyannote : {e}")
        return None


# =============================================================================
# IDENTIFICATION AGENT vs CLIENT
# =============================================================================

def _identify_roles(diarization_segments: list) -> dict:
    """
    Dans un appel CRM sortant, l'agent parle TOUJOURS en premier.
    Identifie le premier locuteur = Agent, les autres = Client.

    Args:
        diarization_segments : liste de (start, end, speaker_label)

    Returns:
        dict mapping speaker_label → "Agent" | "Client"
    """
    if not diarization_segments:
        return {}

    # Premier locuteur détecté = Agent
    first_speaker = diarization_segments[0][2]

    # Construit le mapping pour tous les locuteurs uniques
    seen = []
    for _, _, sp in diarization_segments:
        if sp not in seen:
            seen.append(sp)

    mapping = {}
    agent_assigned = False

    for sp in seen:
        if sp == first_speaker and not agent_assigned:
            mapping[sp] = "Agent"
            agent_assigned = True
        else:
            # S'il y a plus de 2 locuteurs, les autres sont tous "Client"
            mapping[sp] = "Client"

    return mapping


# =============================================================================
# FUSION WHISPER + DIARIZATION
# =============================================================================

def _assign_speaker_to_segment(
    whisper_seg: dict,
    diarization_segments: list
) -> str:
    """
    Trouve le locuteur pyannote qui parle le plus longtemps
    pendant la durée d'un segment Whisper.

    Utilise le chevauchement temporel (overlap) comme critère.
    """
    seg_start = whisper_seg["start"]
    seg_end   = whisper_seg["end"]
    overlap   = {}

    for d_start, d_end, speaker in diarization_segments:
        o_start = max(seg_start, d_start)
        o_end   = min(seg_end,   d_end)
        if o_end > o_start:
            overlap[speaker] = overlap.get(speaker, 0) + (o_end - o_start)

    if not overlap:
        return "UNKNOWN"

    return max(overlap, key=overlap.get)


def _merge_whisper_diarization(
    whisper_segments: list,
    diarization_segments: list,
    role_mapping: dict
) -> list:
    """
    Fusionne les segments Whisper avec les labels de diarization.

    Retourne une liste de segments enrichis :
    [
        {
            "start":   0.0,
            "end":     5.2,
            "speaker": "SPEAKER_00",
            "role":    "Agent",
            "text":    "Bonjour Madame..."
        },
        ...
    ]
    """
    merged = []

    for seg in whisper_segments:
        raw_speaker = _assign_speaker_to_segment(seg, diarization_segments)
        role        = role_mapping.get(raw_speaker, "Inconnu")

        merged.append({
            "start":   round(seg["start"], 1),
            "end":     round(seg["end"],   1),
            "speaker": raw_speaker,
            "role":    role,
            "text":    seg["text"].strip()
        })

    return merged


# =============================================================================
# CALCUL DES STATISTIQUES DE PAROLE
# =============================================================================

def _compute_talk_stats(diarization_segments: list, role_mapping: dict) -> dict:
    """
    Calcule le temps de parole total et le ratio pour chaque rôle.

    Returns:
        {
            "agent_seconds":      18.5,
            "client_seconds":     22.0,
            "total_seconds":      40.5,
            "agent_talk_ratio":   0.46,   ← 46%
            "client_talk_ratio":  0.54,   ← 54%
        }
    """
    role_time = defaultdict(float)

    for start, end, speaker in diarization_segments:
        role = role_mapping.get(speaker, "Inconnu")
        role_time[role] += end - start

    agent_s  = round(role_time.get("Agent",  0.0), 1)
    client_s = round(role_time.get("Client", 0.0), 1)
    total_s  = round(agent_s + client_s, 1)

    if total_s > 0:
        agent_ratio  = round(agent_s  / total_s, 3)
        client_ratio = round(client_s / total_s, 3)
    else:
        agent_ratio  = 0.0
        client_ratio = 0.0

    return {
        "agent_seconds":     agent_s,
        "client_seconds":    client_s,
        "total_seconds":     total_s,
        "agent_talk_ratio":  agent_ratio,
        "client_talk_ratio": client_ratio,
    }


# =============================================================================
# CONSTRUCTION DE LA TRANSCRIPTION ÉTIQUETÉE
# =============================================================================

def _build_labeled_transcript(merged_segments: list) -> str:
    """
    Construit la transcription textuelle avec les étiquettes [Agent] / [Client].

    Fusionne les segments consécutifs du même locuteur pour éviter
    les répétitions de labels.

    Exemple de sortie :
        [Agent] Bonjour Madame, je vous appelle concernant...
        [Client] Oui bonjour, je vous écoute.
        [Agent] Nous avons une offre intéressante pour vous.
        [Client] Je ne suis pas vraiment intéressée.
    """
    if not merged_segments:
        return ""

    lines       = []
    current_role = None
    current_text = []

    for seg in merged_segments:
        role = seg["role"]
        text = seg["text"]

        if not text:
            continue

        if role == current_role:
            # Même locuteur que le segment précédent : on concatène
            current_text.append(text)
        else:
            # Changement de locuteur : on flush le précédent
            if current_role and current_text:
                lines.append(f"[{current_role}] {' '.join(current_text)}")
            current_role = role
            current_text = [text]

    # Flush du dernier bloc
    if current_role and current_text:
        lines.append(f"[{current_role}] {' '.join(current_text)}")

    return "\n".join(lines)


def _extract_role_texts(merged_segments: list) -> tuple:
    """
    Extrait les paroles de l'Agent et du Client séparément.

    Returns:
        (agent_text, client_text) — deux chaînes de caractères
    """
    agent_parts  = []
    client_parts = []

    for seg in merged_segments:
        if not seg["text"]:
            continue
        if seg["role"] == "Agent":
            agent_parts.append(seg["text"])
        elif seg["role"] == "Client":
            client_parts.append(seg["text"])

    return " ".join(agent_parts), " ".join(client_parts)


# =============================================================================
# FALLBACK : DIARIZATION HEURISTIQUE (sans pyannote)
# =============================================================================

def _heuristic_diarization(whisper_segments: list) -> list:
    """
    Diarization basique SANS pyannote, basée sur des heuristiques :

    Règles :
    1. Le premier segment = Agent (appel sortant CRM)
    2. Les silences > 1.5s entre deux segments = changement probable de locuteur
    3. Alternance : si le segment précédent était long (>8s), l'autre parle

    C'est une approximation — pyannote est bien meilleur.
    Utilisé uniquement quand pyannote est indisponible.
    """
    if not whisper_segments:
        return []

    diar_segments = []
    current_speaker = "SPEAKER_00"  # L'agent commence

    for i, seg in enumerate(whisper_segments):
        start = seg["start"]
        end   = seg["end"]

        if i > 0:
            prev_end      = whisper_segments[i - 1]["end"]
            prev_duration = whisper_segments[i - 1]["end"] - whisper_segments[i - 1]["start"]
            silence_gap   = start - prev_end

            # Changement de locuteur si :
            # - silence > 1.5s (pause entre les personnes)
            # - OU segment précédent > 8s (longue intervention → l'autre répond)
            if silence_gap > 1.5 or prev_duration > 8.0:
                current_speaker = (
                    "SPEAKER_01" if current_speaker == "SPEAKER_00" else "SPEAKER_00"
                )

        diar_segments.append((start, end, current_speaker))

    return diar_segments


# =============================================================================
# FONCTION PRINCIPALE : diarize_audio()
# =============================================================================

def diarize_audio(
    audio_path: str,
    whisper_segments: list,
    num_speakers: Optional[int] = 2,
    use_heuristic_fallback: bool = True
) -> dict:
    """
    Point d'entrée principal de la diarization.

    Args:
        audio_path            : Chemin vers le fichier audio (MP3, WAV...)
        whisper_segments      : Segments Whisper (result["segments"] de whisper.transcribe)
        num_speakers          : Nombre de locuteurs attendus (2 par défaut : Agent + Client)
        use_heuristic_fallback: Si True, utilise la diarization heuristique si pyannote échoue

    Returns:
        {
            "diarization_success":  True,          ← pyannote a fonctionné
            "method":               "pyannote",    ← "pyannote" | "heuristic" | "none"
            "labeled_transcript":   "[Agent] Bonjour...\n[Client] Oui...",
            "agent_text":           "Bonjour Madame...",
            "client_text":          "Oui bonjour...",
            "agent_seconds":        18.5,
            "client_seconds":       22.0,
            "total_seconds":        40.5,
            "agent_talk_ratio":     0.46,
            "client_talk_ratio":    0.54,
            "segments":             [...],         ← liste complète des segments fusionnés
            "error":                None,
        }
    """
    # Résultat par défaut (en cas d'échec total)
    fallback_result = {
        "diarization_success": False,
        "method":              "none",
        "labeled_transcript":  " ".join(
            seg.get("text", "") for seg in whisper_segments
        ),
        "agent_text":          "",
        "client_text":         "",
        "agent_seconds":       0.0,
        "client_seconds":      0.0,
        "total_seconds":       0.0,
        "agent_talk_ratio":    0.0,
        "client_talk_ratio":   0.0,
        "segments":            [],
        "error":               None,
    }

    if not whisper_segments:
        fallback_result["error"] = "Aucun segment Whisper fourni"
        return fallback_result

    diarization_segments = []
    method               = "none"

    # ── Tentative 1 : Pyannote ─────────────────────────────────────────────────
    pipeline = _load_pipeline()

    if pipeline is not None:
        try:
            log.info(f"Diarization pyannote sur : {audio_path}")
            t0 = time.time()

            # Lance la diarization
            diarization = pipeline(
                audio_path,
                num_speakers=num_speakers  # On sait qu'il y a 2 personnes
            )

            # Convertit le résultat pyannote en liste (start, end, speaker)
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                diarization_segments.append((
                    round(turn.start, 3),
                    round(turn.end,   3),
                    speaker
                ))

            log.info(
                f"Diarization pyannote terminée en {time.time()-t0:.1f}s "
                f"— {len(diarization_segments)} segments détectés"
            )
            method = "pyannote"

        except Exception as e:
            log.warning(f"Pyannote échoué : {e}")
            diarization_segments = []

    # ── Tentative 2 : Heuristique (fallback) ──────────────────────────────────
    if not diarization_segments and use_heuristic_fallback:
        log.info("Utilisation de la diarization heuristique (fallback)...")
        diarization_segments = _heuristic_diarization(whisper_segments)
        method = "heuristic"

    # ── Échec total ───────────────────────────────────────────────────────────
    if not diarization_segments:
        fallback_result["error"] = "Diarization impossible (pyannote et heuristique ont échoué)"
        return fallback_result

    # ── Traitement ────────────────────────────────────────────────────────────

    # Identifie les rôles (Agent = premier locuteur dans appel sortant CRM)
    role_mapping = _identify_roles(diarization_segments)

    # Fusionne les segments Whisper avec les labels de diarization
    merged = _merge_whisper_diarization(
        whisper_segments, diarization_segments, role_mapping
    )

    # Construit la transcription étiquetée
    labeled_transcript = _build_labeled_transcript(merged)

    # Extrait les paroles par rôle
    agent_text, client_text = _extract_role_texts(merged)

    # Calcule les statistiques de temps de parole
    stats = _compute_talk_stats(diarization_segments, role_mapping)

    return {
        "diarization_success": True,
        "method":              method,
        "labeled_transcript":  labeled_transcript,
        "agent_text":          agent_text,
        "client_text":         client_text,
        "agent_seconds":       stats["agent_seconds"],
        "client_seconds":      stats["client_seconds"],
        "total_seconds":       stats["total_seconds"],
        "agent_talk_ratio":    stats["agent_talk_ratio"],
        "client_talk_ratio":   stats["client_talk_ratio"],
        "segments":            merged,
        "error":               None,
    }