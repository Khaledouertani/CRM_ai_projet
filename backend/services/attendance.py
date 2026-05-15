"""
services/attendance.py
Pointage automatique via detection des appels
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
from models.database import get_connection


def get_first_last_call(agent_id: str, target_date: date = None) -> Tuple[Optional[datetime], Optional[datetime]]:
    if target_date is None:
        target_date = date.today()
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MIN(call_date) as first_call, MAX(call_date) as last_call
        FROM calls
        WHERE agent_id = %s AND DATE(call_date) = %s
    """, (agent_id, target_date))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return (result[0] if result and result[0] else None,
            result[1] if result and result[1] else None)


def calculate_productive_time(agent_id: str, target_date: date = None) -> Dict:
    first_call, last_call = get_first_last_call(agent_id, target_date)
    
    if not first_call or not last_call:
        return {
            "first_call": None, "last_call": None,
            "total_presence_minutes": 0, "productive_time_minutes": 0, "call_count": 0
        }
    
    total_presence = (last_call - first_call).total_seconds() / 60
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT SUM(call_duration) as total_duration, COUNT(*) as call_count
        FROM calls WHERE agent_id = %s AND DATE(call_date) = %s
    """, (agent_id, target_date))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return {
        "first_call": first_call, "last_call": last_call,
        "total_presence_minutes": round(total_presence, 1),
        "productive_time_minutes": round((result[0] or 0) / 60, 1) if result else 0,
        "call_count": result[1] if result else 0
    }


def check_attendance(agent_id: str, scheduled_start: str, scheduled_end: str,
                     target_date: date = None) -> Dict:
    first_call, last_call = get_first_last_call(agent_id, target_date)
    if target_date is None:
        target_date = date.today()
    
    sched_start = datetime.strptime(f"{target_date} {scheduled_start}", "%Y-%m-%d %H:%M")
    sched_end = datetime.strptime(f"{target_date} {scheduled_end}", "%Y-%m-%d %H:%M")
    
    result = {
        "scheduled_start": scheduled_start, "scheduled_end": scheduled_end,
        "actual_start": first_call.strftime("%H:%M") if first_call else None,
        "actual_end": last_call.strftime("%H:%M") if last_call else None,
        "late_minutes": 0, "early_departure_minutes": 0,
        "is_late": False, "is_early_departure": False
    }
    
    if first_call and first_call > sched_start + timedelta(minutes=15):
        result["is_late"] = True
        result["late_minutes"] = int((first_call - sched_start).total_seconds() / 60)
    
    if last_call and last_call < sched_end - timedelta(minutes=15):
        result["is_early_departure"] = True
        result["early_departure_minutes"] = int((sched_end - last_call).total_seconds() / 60)
    
    return result


def get_team_attendance(team_date: date = None) -> List[Dict]:
    if team_date is None:
        team_date = date.today()
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT agent_id, agent_name FROM calls WHERE DATE(call_date) = %s
    """, (team_date,))
    agents = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return [{
        "agent_id": aid, "agent_name": name,
        "first_call": fc.strftime("%H:%M:%S") if (fc := get_first_last_call(aid, team_date)[0]) else None,
        "last_call": lc.strftime("%H:%M:%S") if (lc := get_first_last_call(aid, team_date)[1]) else None,
        "date": team_date.isoformat()
    } for aid, name in agents]


def update_agent_stats(agent_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MIN(call_date), MAX(call_date), COUNT(*) FROM calls WHERE agent_id = %s
    """, (agent_id,))
    result = cursor.fetchone()
    if result:
        cursor.execute("""
            UPDATE agents SET first_call = %s, last_call = %s, total_calls = %s WHERE agent_id = %s
        """, (result[0], result[1], result[2], agent_id))
        conn.commit()
    cursor.close()
    conn.close()