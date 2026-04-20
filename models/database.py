"""
models/database.py
==================
Connexion MySQL + insertion + chargement des données.

Modifications v2 :
  - Anonymisation RGPD des transcriptions avant insertion
  - Nouveaux champs : diarization, inactivity, keywords (liste)
  - Migration automatique des colonnes manquantes
"""

import re
import json
import warnings
import pymysql
import pandas as pd
import streamlit as st


# =============================================================================
# CONNEXIONS
# =============================================================================


def get_connection():
    """Connexion avec DictCursor pour insert_call."""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia',
        cursorclass=pymysql.cursors.DictCursor
    )

def get_pandas_connection():
    """Connexion sans DictCursor pour pd.read_sql_query."""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='pfe_crm_ia'
    )

def create_db():
    """Kept for backward compatibility. DB managed via phpMyAdmin."""
    _migrate_columns()


# =============================================================================
# MIGRATION AUTOMATIQUE DES COLONNES MANQUANTES
# =============================================================================

def _migrate_columns():
    """
    Ajoute automatiquement les nouvelles colonnes si elles n'existent pas.
    Évite les erreurs SQL lors du premier déploiement de la v2.
    """
    new_columns = [
        ("labeled_transcript",  "TEXT"),
        ("agent_text",          "TEXT"),
        ("client_text",         "TEXT"),
        ("agent_talk_ratio",    "FLOAT DEFAULT 0"),
        ("client_talk_ratio",   "FLOAT DEFAULT 0"),
        ("agent_seconds",       "FLOAT DEFAULT 0"),
        ("client_seconds",      "FLOAT DEFAULT 0"),
        ("diarization_method",  "VARCHAR(20) DEFAULT 'none'"),
        ("inactivity_detected", "TINYINT(1) DEFAULT 0"),
        ("inactivity_duration", "FLOAT DEFAULT 0"),
        ("postal_code",         "VARCHAR(10)"),
        ("script_respected",    "TINYINT(1) DEFAULT 0"),
        ("customer_intent",     "VARCHAR(100)"),
        ("objections_handled",  "TINYINT(1) DEFAULT 0"),
        ("agent_politeness",    "INT DEFAULT 5"),
        ("next_steps",          "TEXT"),
        ("appointment_date",    "VARCHAR(100)"),
        ("appointment_confidence", "INT DEFAULT 0"),
        ("score_ecoute",        "INT DEFAULT 0"),
        ("score_persuasion",    "INT DEFAULT 0"),
        ("score_empathie",      "INT DEFAULT 0"),
        ("score_argumentation", "INT DEFAULT 0"),
        ("score_refus",         "INT DEFAULT 0"),
        ("score_vente",         "INT DEFAULT 0"),
    ]

    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM calls")
            existing = {row["Field"] for row in cur.fetchall()}
            for col_name, col_type in new_columns:
                if col_name not in existing:
                    cur.execute(f"ALTER TABLE calls ADD COLUMN {col_name} {col_type}")
                    print(f"[Migration] Colonne ajoutée : {col_name}")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Migration] Erreur (non bloquant) : {e}")


# =============================================================================

# =============================================================================

# Patterns à censurer dans les transcriptions
_RGPD_PATTERNS = [
    # Numéros de carte bancaire (16 chiffres, avec ou sans espaces/tirets)
    (re.compile(r'\b(?:\d[ \-]?){13,16}\d\b'),                     "[CB CENSURÉE]"),
    # Numéros de téléphone français
    (re.compile(r'\b0[1-9](?:[ .\-]?\d{2}){4}\b'),                 "[TÉL CENSURÉ]"),
    # Adresses email
    (re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b'), "[EMAIL CENSURÉ]"),
    # Numéros de sécurité sociale (13+1 chiffres)
    (re.compile(r'\b[12]\s?\d{2}\s?\d{2}\s?\d{2,3}\s?\d{3}\s?\d{3}\s?\d{2}\b'), "[NIR CENSURÉ]"),
    # IBAN français
    (re.compile(r'\bFR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{3}\b', re.IGNORECASE), "[IBAN CENSURÉ]"),
]

def anonymize_text(text: str) -> str:
    """
    Anonymise les données sensibles dans un texte (transcription).
    Remplace : numéros CB, téléphones, emails, NIR, IBAN.
    Retourne le texte nettoyé.
    """
    if not text:
        return text
    for pattern, replacement in _RGPD_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


# =============================================================================
# INSERT CALL
# =============================================================================

def insert_call(data: dict):
    """
    Insère un appel analysé dans MySQL.
    Anonymise automatiquement la transcription avant insertion (RGPD).
    """
    # ── Anonymisation RGPD ─────────────────────────────────────────────────────
    raw_transcription = data.get("transcription", "")
    clean_transcription = anonymize_text(raw_transcription)

    raw_summary = data.get("summary", "")
    clean_summary = anonymize_text(raw_summary)

    # ── Keywords : convertir liste → JSON string ───────────────────────────────
    keywords = data.get("keywords", [])
    if isinstance(keywords, list):
        keywords_str = json.dumps(keywords, ensure_ascii=False)
    else:
        keywords_str = str(keywords)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:

            # ── Upsert Agent ───────────────────────────────────────────────────
            agent_name = data.get("agent_name", "Unknown")
            agent_id   = agent_name.lower().replace(" ", "_")

            cursor.execute("SELECT id FROM agents WHERE agent_id = %s", (agent_id,))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO agents (agent_id, name, created_at) VALUES (%s, %s, NOW())",
                    (agent_id, agent_name)
                )

            # ── Insert Call ────────────────────────────────────────────────────
            cursor.execute("""
            INSERT INTO calls (
                agent_id, agent_name, audio_file,
                transcription, sentiment, sentiment_score,
                score_percentage, performance, summary, keywords,
                call_type, problem, postal_code,
                script_respected, customer_intent,
                objections_handled, agent_politeness, next_steps,
                appointment_date, appointment_confidence,
                score_ecoute, score_persuasion, score_empathie,
                score_argumentation, score_refus, score_vente,
                labeled_transcript, agent_text, client_text,
                agent_talk_ratio, client_talk_ratio,
                agent_seconds, client_seconds, diarization_method,
                inactivity_detected, inactivity_duration,
                call_date, created_at
            )
            VALUES (
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, NOW()
            )
            """, (
                agent_id,
                agent_name,
                data.get("audio_path", ""),
                
                clean_transcription,
                data.get("sentiment", ""),
                float(data.get("sentiment_score", 0.0)),
                float(data.get("score_percentage", 0.0)),
                data.get("performance", ""),
                
                clean_summary,
                keywords_str,
                data.get("call_type", ""),
                data.get("problem", ""),
                data.get("postal_code", ""),
                int(bool(data.get("script_respected", False))),
                data.get("customer_intent", ""),
                int(bool(data.get("objections_handled", False))),
                int(data.get("agent_politeness", 5)),
                data.get("next_steps", ""),
                data.get("appointment_date", ""),
                int(data.get("appointment_confidence", 0)),
                int(data.get("score_ecoute", 0)),
                int(data.get("score_persuasion", 0)),
                int(data.get("score_empathie", 0)),
                int(data.get("score_argumentation", 0)),
                int(data.get("score_refus", 0)),
                int(data.get("score_vente", 0)),
                
                data.get("labeled_transcript", ""),
                data.get("agent_text", ""),
                data.get("client_text", ""),
                float(data.get("agent_talk_ratio", 0.0)),
                float(data.get("client_talk_ratio", 0.0)),
                float(data.get("agent_seconds", 0.0)),
                float(data.get("client_seconds", 0.0)),
                data.get("diarization_method", "none"),
                
                int(bool(data.get("inactivity_detected", False))),
                float(data.get("inactivity_duration", 0.0)),
                str(data.get("call_time", "")),
            ))
        conn.commit()

    except Exception as e:
        print(f"[database] insert_call error: {e}")
        raise

    finally:
        conn.close()
        try:
            load_data.clear()
        except Exception:
            pass


# =============================================================================
# LOAD DATA
# =============================================================================

def clear_data_cache():
    load_data.clear()


@st.cache_data(ttl=60)
def load_data() -> pd.DataFrame:
    _migrate_columns()  
    """
    Charge tous les appels depuis MySQL dans un DataFrame pandas.
    Cache de 60 secondes pour éviter les requêtes répétées.
    """
    conn = get_pandas_connection()
    query = """
    SELECT
        id                                          AS call_id,
        agent_name,
        audio_file                                  AS audio_path,
        transcription,
        sentiment,
        sentiment_score,
        CAST(score_percentage AS DECIMAL(10,2))     AS score_percentage,
        performance,
        summary,
        keywords,
        call_type,
        problem,
        COALESCE(postal_code, '')                   AS postal_code,
        COALESCE(script_respected, 0)               AS script_respected,
        COALESCE(customer_intent, '')               AS customer_intent,
        COALESCE(objections_handled, 0)             AS objections_handled,
        COALESCE(agent_politeness, 5)               AS agent_politeness,
        COALESCE(next_steps, '')                    AS next_steps,
        COALESCE(appointment_date, '')              AS appointment_date,
        COALESCE(appointment_confidence, 0)         AS appointment_confidence,
        COALESCE(score_ecoute, 0)                   AS score_ecoute,
        COALESCE(score_persuasion, 0)               AS score_persuasion,
        COALESCE(score_empathie, 0)                 AS score_empathie,
        COALESCE(score_argumentation, 0)            AS score_argumentation,
        COALESCE(score_refus, 0)                    AS score_refus,
        COALESCE(score_vente, 0)                    AS score_vente,
        COALESCE(labeled_transcript, '')            AS labeled_transcript,
        COALESCE(agent_talk_ratio, 0)               AS agent_talk_ratio,
        COALESCE(client_talk_ratio, 0)              AS client_talk_ratio,
        COALESCE(agent_seconds, 0)                  AS agent_seconds,
        COALESCE(client_seconds, 0)                 AS client_seconds,
        COALESCE(diarization_method, 'none')        AS diarization_method,
        COALESCE(inactivity_detected, 0)            AS inactivity_detected,
        COALESCE(inactivity_duration, 0)            AS inactivity_duration,
        call_date                                   AS call_time
    FROM calls
    ORDER BY call_date DESC
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            df = pd.read_sql_query(query, conn)
    finally:
        conn.close()

    # Nettoyage numérique
    for col in ["score_percentage", "sentiment_score", "agent_talk_ratio",
                "client_talk_ratio", "agent_seconds", "client_seconds", "inactivity_duration"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df