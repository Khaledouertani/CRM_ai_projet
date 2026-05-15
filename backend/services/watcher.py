"""
services/watcher.py
===================
Watcher automatique — surveille le dossier audio/ et déclenche
l'analyse IA dès qu'un nouveau fichier MP3/WAV est détecté.

Utilisation :
    python services/watcher.py

Dépendances à installer :
    pip install watchdog apscheduler requests
"""

import os
import sys
import time
import logging
import requests
from pathlib import Path
from datetime import datetime

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ── Configuration ─────────────────────────────────────────────────────────────

# Dossier à surveiller (relatif à la racine du projet)
AUDIO_DIR = Path("audio")

# Extensions audio acceptées
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg"}

# URL de ton FastAPI backend (controllers/api_routes.py → /analyze_call)
FASTAPI_URL = "http://localhost:8000/analyze_call"

# Temps d'attente après détection avant envoi (évite les fichiers encore en écriture)
STABILIZE_DELAY = 3  # secondes

# Fichier log
LOG_FILE = "logs/watcher.log"

# ── Logging ───────────────────────────────────────────────────────────────────

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("watcher")


# ── Extraction du nom d'agent depuis le nom de fichier ────────────────────────

def extract_agent_name(filepath: Path) -> str:
    """
    Extrait le nom de l'agent depuis le nom du fichier.

    Exemples de noms de fichiers supportés :
        RDV_SANA_20-02.mp3      → "SANA"
        APPEL_ALI_2026.mp3      → "ALI"
        omar_call_001.mp3       → "omar"
        test.mp3                → "Inconnu"

    Logique : prend le 2ème mot séparé par _ si disponible,
    sinon retourne "Inconnu".
    """
    stem = filepath.stem  # nom sans extension
    parts = stem.replace("-", "_").replace(" ", "_").split("_")

    # Si le nom contient au moins 2 parties (ex: RDV_SANA)
    if len(parts) >= 2:
        # Ignore les préfixes connus (RDV, APPEL, CALL, AUDIO)
        prefixes_connus = {"rdv", "appel", "call", "audio", "rec", "enr"}
        for part in parts:
            if part.lower() not in prefixes_connus and len(part) > 1 and not part.isdigit():
                return part.capitalize()

    return "Inconnu"


# ── Envoi vers FastAPI ────────────────────────────────────────────────────────

def send_to_fastapi(filepath: Path) -> bool:
    """
    Envoie le fichier audio vers le endpoint FastAPI /analyze_call.
    Retourne True si succès, False sinon.
    """
    agent_name = extract_agent_name(filepath)
    log.info(f"Envoi de '{filepath.name}' → agent détecté : '{agent_name}'")

    try:
        with open(filepath, "rb") as audio_file:
            response = requests.post(
                FASTAPI_URL,
                files={"file": (filepath.name, audio_file, "audio/mpeg")},
                data={"agent_name": agent_name},
                timeout=300,  # 5 min max pour Whisper + Llama3
            )

        if response.status_code == 200:
            result = response.json()
            log.info(
                f"✅ Analyse terminée pour '{filepath.name}' | "
                f"Score: {result.get('score_percentage', '?')}% | "
                f"Sentiment: {result.get('sentiment', '?')}"
            )
            return True
        else:
            log.error(
                f"❌ Erreur FastAPI {response.status_code} pour '{filepath.name}': "
                f"{response.text[:200]}"
            )
            return False

    except requests.exceptions.ConnectionError:
        log.error(
            "❌ Impossible de joindre FastAPI sur "
            f"{FASTAPI_URL}. Le serveur est-il démarré ? "
            "(uvicorn main:app --reload)"
        )
        return False

    except requests.exceptions.Timeout:
        log.error(
            f"⏱️ Timeout lors de l'analyse de '{filepath.name}'. "
            "Whisper ou Llama3 prend trop de temps. Augmente STABILIZE_DELAY."
        )
        return False

    except Exception as e:
        log.error(f"❌ Erreur inattendue pour '{filepath.name}': {e}")
        return False


# ── Handler Watchdog ──────────────────────────────────────────────────────────

class AudioFileHandler(FileSystemEventHandler):
    """
    Réagit aux nouveaux fichiers audio déposés dans AUDIO_DIR.
    """

    def __init__(self):
        super().__init__()
        # Garde en mémoire les fichiers déjà traités (évite les doublons)
        self._already_processed: set = set()

    def on_created(self, event):
        """Déclenché quand un fichier est créé dans le dossier surveillé."""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        # Vérifie l'extension
        if filepath.suffix.lower() not in AUDIO_EXTENSIONS:
            return

        # Évite le double traitement
        if str(filepath) in self._already_processed:
            log.debug(f"Fichier déjà traité, ignoré : {filepath.name}")
            return

        log.info(f"🎙️ Nouveau fichier détecté : {filepath.name}")

        # Attend que le fichier soit complètement écrit (copie réseau, etc.)
        self._wait_for_file_stable(filepath)

        # Marque comme traité et envoie
        self._already_processed.add(str(filepath))
        send_to_fastapi(filepath)

    def on_moved(self, event):
        """
        Déclenché quand un fichier est déplacé DANS le dossier.
        Cas d'usage : l'agent dépose le fichier dans un dossier temp
        puis le déplace dans audio/.
        """
        if event.is_directory:
            return

        filepath = Path(event.dest_path)

        if filepath.suffix.lower() not in AUDIO_EXTENSIONS:
            return

        if str(filepath) in self._already_processed:
            return

        log.info(f"🎙️ Fichier déplacé détecté : {filepath.name}")
        self._wait_for_file_stable(filepath)
        self._already_processed.add(str(filepath))
        send_to_fastapi(filepath)

    def _wait_for_file_stable(self, filepath: Path, timeout: int = 60):
        """
        Attend que la taille du fichier soit stable (fichier entièrement écrit).
        Évite d'envoyer un fichier encore en cours de copie.
        """
        last_size = -1
        elapsed = 0

        while elapsed < timeout:
            try:
                current_size = filepath.stat().st_size
            except FileNotFoundError:
                time.sleep(1)
                elapsed += 1
                continue

            if current_size == last_size and current_size > 0:
                log.debug(
                    f"Fichier stable ({current_size} octets) après {elapsed}s : "
                    f"{filepath.name}"
                )
                # Attend encore STABILIZE_DELAY secondes par sécurité
                time.sleep(STABILIZE_DELAY)
                return

            last_size = current_size
            time.sleep(1)
            elapsed += 1

        log.warning(
            f"⚠️ Timeout stabilisation pour '{filepath.name}' "
            f"après {timeout}s — envoi quand même."
        )


# ── Scan des fichiers existants au démarrage ──────────────────────────────────

def scan_existing_files(handler: AudioFileHandler):
    """
    Au démarrage du watcher, analyse les fichiers audio déjà présents
    dans audio/ qui n'ont pas encore été traités (pas en base de données).
    
    Utilise la base SQLite pour vérifier si le fichier existe déjà.
    """
    import sqlite3

    # Chemin vers la base SQLite (adapte si tu utilises MySQL)
    db_path = Path("crm.db")
    if not db_path.exists():
        log.info("Base de données introuvable — scan des fichiers existants ignoré.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT audio_path FROM calls")
        already_in_db = {row[0] for row in cur.fetchall()}
        conn.close()
    except Exception as e:
        log.warning(f"Impossible de lire la DB pour le scan initial : {e}")
        already_in_db = set()

    if not AUDIO_DIR.exists():
        log.warning(f"Dossier audio/ introuvable : {AUDIO_DIR.resolve()}")
        return

    audio_files = [
        f for f in AUDIO_DIR.iterdir()
        if f.suffix.lower() in AUDIO_EXTENSIONS
    ]

    new_files = [
        f for f in audio_files
        if str(f) not in already_in_db and f"audio/{f.name}" not in already_in_db
    ]

    if not new_files:
        log.info("✅ Aucun fichier audio en attente d'analyse au démarrage.")
        return

    log.info(
        f"📂 {len(new_files)} fichier(s) non analysé(s) trouvé(s) au démarrage — "
        "lancement de l'analyse..."
    )

    for filepath in new_files:
        handler._already_processed.add(str(filepath))
        send_to_fastapi(filepath)


# ── Point d'entrée principal ──────────────────────────────────────────────────

def start_watcher():
    """
    Démarre le watcher. Tourne indéfiniment jusqu'à Ctrl+C.
    """
    # Crée le dossier audio/ s'il n'existe pas
    AUDIO_DIR.mkdir(exist_ok=True)

    log.info("=" * 55)
    log.info("  CRM IA — Watcher automatique démarré")
    log.info(f"  Dossier surveillé : {AUDIO_DIR.resolve()}")
    log.info(f"  Backend FastAPI   : {FASTAPI_URL}")
    log.info(f"  Extensions        : {', '.join(AUDIO_EXTENSIONS)}")
    log.info("=" * 55)

    handler = AudioFileHandler()

    # Analyse les fichiers déjà présents avant de démarrer la surveillance
    scan_existing_files(handler)

    # Démarre l'observateur Watchdog
    observer = Observer()
    observer.schedule(handler, str(AUDIO_DIR), recursive=False)
    observer.start()

    log.info(f"👁️  Surveillance active sur '{AUDIO_DIR}/' — Ctrl+C pour arrêter\n")

    try:
        while True:
            time.sleep(2)
            # Vérifie que l'observer tourne toujours
            if not observer.is_alive():
                log.error("Observer arrêté de façon inattendue — redémarrage...")
                observer.start()

    except KeyboardInterrupt:
        log.info("\n🛑 Arrêt du watcher demandé par l'utilisateur.")
        observer.stop()

    observer.join()
    log.info("Watcher arrêté proprement.")


if __name__ == "__main__":
    start_watcher()