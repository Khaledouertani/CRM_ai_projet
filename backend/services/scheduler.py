"""
services/scheduler.py
=====================
Scheduler pour les tâches automatiques du CRM.
Peut être exécuté en tant que processus séparé.
"""

import schedule
import time
from datetime import datetime
from services.followup import run_daily_followup_check, generate_followup_report


def job_daily_followup():
    """Tâche quotidienne de vérification des follow-ups."""
    print(f"[{datetime.now()}] Exécution du check follow-ups quotidien...")
    
    pending, stats = run_daily_followup_check()
    
    print(f"Stats follow-ups: {stats}")
    
    if stats["total_a_relancer"] > 0:
        report = generate_followup_report()
        print(report)
    
    return stats


def start_scheduler():
    """
    Démarre le scheduler avec les tâches planifiées.
    
    Exécution:
        python -m services.scheduler
    
    Ou intégré au démarrage de FastAPI.
    """
    print("Démarrage du scheduler CRM...")
    
    schedule.every().day.at("09:00").do(job_daily_followup)
    
    schedule.every().hour.do(lambda: print(f"[{datetime.now()}] Heartbeat scheduler"))
    
    print("Scheduler démarré. Tâches planifiées:")
    print("  - Daily follow-up check: 09:00")
    
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    start_scheduler()
