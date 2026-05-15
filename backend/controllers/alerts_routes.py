"""
alerts_routes.py
==============
API routes for alert management.
"""

from fastapi import APIRouter, Header, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from services.alerts import (
    get_alert_rules,
    get_rule_by_type,
    create_alert_rule,
    update_alert_rule,
    delete_alert_rule,
    check_all_alerts,
    send_alert_notification,
    log_alert,
    get_alert_history,
    check_realtime_alerts
)
from services.auth_service import verify_token


def get_user(authorization: str = Header(None)) -> dict:
    """Verify token and return user."""
    user = verify_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertRuleCreate(BaseModel):
    rule_type: str
    threshold_value: int
    notification_email: str


class AlertRuleUpdate(BaseModel):
    threshold_value: int
    is_active: bool = True


@router.get("/rules")
async def get_rules(authorization: Optional[str] = Header(None)):
    """Get all alert rules."""
    user = get_user(authorization)
    rules = get_alert_rules()
    return {"rules": rules}


@router.get("/rules/{rule_type}")
async def get_rule(rule_type: str, authorization: Optional[str] = Header(None)):
    """Get alert rule by type."""
    user = get_user(authorization)
    rule = get_rule_by_type(rule_type)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("/rules")
async def create_rule(
    request: AlertRuleCreate,
    authorization: Optional[str] = Header(None)
):
    """Create new alert rule."""
    user = get_user(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    success = create_alert_rule(
        request.rule_type,
        request.threshold_value,
        request.notification_email
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create rule")
    
    return {"status": "success", "message": "Alert rule created"}


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: int,
    request: AlertRuleUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update alert rule."""
    user = get_user(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    success = update_alert_rule(rule_id, request.threshold_value, request.is_active)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update rule")
    
    return {"status": "success", "message": "Alert rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: int,
    authorization: Optional[str] = Header(None)
):
    """Delete alert rule."""
    user = get_user(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    success = delete_alert_rule(rule_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete rule")
    
    return {"status": "success", "message": "Alert rule deleted"}


@router.get("/history")
async def get_history(
    agent_name: str = None,
    limit: int = 50,
    authorization: Optional[str] = Header(None)
):
    """Get alert history."""
    user = get_user(authorization)
    history = get_alert_history(agent_name, limit)
    return {"history": history}


@router.get("/check/{agent_name}")
async def check_agent_alerts(
    agent_name: str,
    score: float = None,
    inactive_minutes: float = None,
    conversion_rate: float = None,
    authorization: Optional[str] = Header(None)
):
    """Check alerts for an agent."""
    user = get_user(authorization)
    alerts = check_all_alerts(agent_name, score, inactive_minutes, conversion_rate)
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/realtime/{agent_name}")
async def realtime_check(agent_name: str, authorization: Optional[str] = Header(None)):
    """Real-time alert check for agent."""
    user = get_user(authorization)
    alerts = check_realtime_alerts(agent_name)
    return {"alerts": alerts, "count": len(alerts)}


@router.post("/notify")
async def trigger_notification(
    alert: dict,
    authorization: Optional[str] = Header(None)
):
    """Manually trigger alert notification."""
    user = get_user(authorization)
    send_alert_notification(alert)
    log_alert(alert)
    return {"status": "success"}