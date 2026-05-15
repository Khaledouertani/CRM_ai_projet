"""
services/alerts.py
=================
Alert system for CRM AI.
Monitors agent performance and sends notifications when thresholds are exceeded.

Alert Types:
    - low_score: Agent score below threshold
    - inactivity: Agent inactive for X minutes
    - conversion: Conversion rate below threshold
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from models.database import get_connection


def get_db():
    """Get database connection."""
    return get_connection()


def get_alert_rules() -> List[Dict]:
    """Get all alert rules from database."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM alert_rules WHERE is_active = TRUE")
    rules = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return rules


def get_rule_by_type(rule_type: str) -> Optional[Dict]:
    """Get alert rule by type."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT * FROM alert_rules WHERE rule_type = %s AND is_active = TRUE",
        (rule_type,)
    )
    rule = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return rule


def create_alert_rule(rule_type: str, threshold_value: int, notification_email: str) -> bool:
    """Create new alert rule."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """INSERT INTO alert_rules (rule_type, threshold_value, notification_email) 
               VALUES (%s, %s, %s)""",
            (rule_type, threshold_value, notification_email)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating alert rule: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


def update_alert_rule(rule_id: int, threshold_value: int, is_active: bool = True) -> bool:
    """Update alert rule threshold."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """UPDATE alert_rules 
               SET threshold_value = %s, is_active = %s, updated_at = NOW() 
               WHERE id = %s""",
            (threshold_value, is_active, rule_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating alert rule: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


def delete_alert_rule(rule_id: int) -> bool:
    """Delete alert rule."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM alert_rules WHERE id = %s", (rule_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting alert rule: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


def check_score_alert(agent_name: str, score: float) -> Optional[Dict]:
    """Check if agent score triggers alert."""
    rule = get_rule_by_type("low_score")
    
    if not rule:
        return None
    
    if score < rule["threshold_value"]:
        return {
            "type": "low_score",
            "severity": "error",
            "agent": agent_name,
            "score": score,
            "threshold": rule["threshold_value"],
            "message": f"⚠️ Score faible pour {agent_name}: {score}% (seuil: {rule['threshold_value']}%)",
            "email": rule["notification_email"]
        }
    
    return None


def check_inactivity_alert(agent_name: str, inactive_minutes: float) -> Optional[Dict]:
    """Check if agent inactivity triggers alert."""
    rule = get_rule_by_type("inactivity")
    
    if not rule:
        return None
    
    if inactive_minutes > rule["threshold_value"]:
        return {
            "type": "inactivity",
            "severity": "warning",
            "agent": agent_name,
            "duration": inactive_minutes,
            "threshold": rule["threshold_value"],
            "message": f"⚠️ {agent_name} inactif depuis {inactive_minutes:.1f} min (seuil: {rule['threshold_value']} min)",
            "email": rule["notification_email"]
        }
    
    return None


def check_conversion_alert(agent_name: str, conversion_rate: float) -> Optional[Dict]:
    """Check if conversion rate triggers alert."""
    rule = get_rule_by_type("conversion")
    
    if not rule:
        return None
    
    if conversion_rate < rule["threshold_value"]:
        return {
            "type": "conversion",
            "severity": "error",
            "agent": agent_name,
            "rate": conversion_rate,
            "threshold": rule["threshold_value"],
            "message": f"🔴 Taux de conversion faible pour {agent_name}: {conversion_rate}% (seuil: {rule['threshold_value']}%)",
            "email": rule["notification_email"]
        }
    
    return None


def check_all_alerts(agent_name: str = None, score: float = None, 
                    inactive_minutes: float = None, conversion_rate: float = None) -> List[Dict]:
    """Check all configured alerts and return triggered alerts."""
    alerts = []
    
    if score is not None and agent_name:
        alert = check_score_alert(agent_name, score)
        if alert:
            alerts.append(alert)
    
    if inactive_minutes is not None and agent_name:
        alert = check_inactivity_alert(agent_name, inactive_minutes)
        if alert:
            alerts.append(alert)
    
    if conversion_rate is not None and agent_name:
        alert = check_conversion_alert(agent_name, conversion_rate)
        if alert:
            alerts.append(alert)
    
    return alerts


def send_alert_notification(alert: Dict) -> bool:
    """Send alert notification (email placeholder)."""
    print(f"📧 ALERTE ENVOYÉE: {alert['message']}")
    print(f"   Destinataire: {alert.get('email', 'admin@crm.local')}")
    return True


def log_alert(alert: Dict) -> bool:
    """Log alert to database for history."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """INSERT INTO alert_history (agent_name, alert_type, severity, message, threshold_value, actual_value)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                alert.get("agent", "unknown"),
                alert["type"],
                alert.get("severity", "warning"),
                alert["message"],
                alert.get("threshold", 0),
                alert.get("score") or alert.get("duration") or alert.get("rate", 0)
            )
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error logging alert: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


def get_alert_history(agent_name: str = None, limit: int = 50) -> List[Dict]:
    """Get alert history."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    if agent_name:
        cursor.execute(
            """SELECT * FROM alert_history 
               WHERE agent_name = %s 
               ORDER BY created_at DESC LIMIT %s""",
            (agent_name, limit)
        )
    else:
        cursor.execute(
            """SELECT * FROM alert_history 
               ORDER BY created_at DESC LIMIT %s""",
            (limit,)
        )
    
    history = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return history


def check_realtime_alerts(agent_name: str) -> List[Dict]:
    """Check real-time alerts for an agent (called during/after calls)."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    today = datetime.now().date()
    
    cursor.execute(
        """SELECT agent_name, AVG(score_percentage) as avg_score, 
                  COUNT(*) as call_count
           FROM calls 
           WHERE agent_name = %s AND DATE(call_date) = %s
           GROUP BY agent_name""",
        (agent_name, today)
    )
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not result:
        return []
    
    alerts = []
    
    if result["avg_score"]:
        alert = check_score_alert(agent_name, result["avg_score"])
        if alert:
            alerts.append(alert)
    
    return alerts