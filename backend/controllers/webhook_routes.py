"""
controllers/webhook_routes.py
=============================
Webhook endpoints for Asterisk/Aircall integration.
"""

from fastapi import APIRouter, Request, Header
from typing import Optional
import json

from services.webhook import (
    process_webhook,
    verify_aircall_webhook,
    verify_asterisk_webhook,
    create_webhook_response,
    get_webhook_endpoints
)

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.get("/endpoints")
def list_endpoints():
    """Retourne les URLs des endpoints webhook configurés."""
    return get_webhook_endpoints()


@router.post("/aircall")
async def aircall_webhook(
    request: Request,
    x_aircall_signature: Optional[str] = Header(None, alias="x-aircall-signature")
):
    """
    Endpoint pour les webhooks Aircall.
    
    Configure cette URL dans Aircall:
    https://votre-domaine.com/api/webhook/aircall
    """
    try:
        body = await request.body()
        
        if x_aircall_signature:
            if not verify_aircall_webhook(body, x_aircall_signature):
                return create_webhook_response(False, "Invalid signature")
        
        data = json.loads(body)
        result = process_webhook(data, source="aircall")
        
        return create_webhook_response(True, "Webhook processed", result)
    
    except Exception as e:
        return create_webhook_response(False, f"Error: {str(e)}")


@router.post("/asterisk")
async def asterisk_webhook(
    request: Request,
    token: Optional[str] = None
):
    """
    Endpoint pour les webhooks Asterisk (FreePBX).
    
    Configure cette URL dans Asterisk:
    https://votre-domaine.com/api/webhook/asterisk?token=VOTRE_TOKEN
    """
    try:
        if token:
            if not verify_asterisk_webhook(token):
                return create_webhook_response(False, "Invalid token")
        
        data = await request.json()
        result = process_webhook(data, source="asterisk")
        
        return create_webhook_response(True, "Webhook processed", result)
    
    except Exception as e:
        return create_webhook_response(False, f"Error: {str(e)}")


@router.post("/generic")
async def generic_webhook(request: Request):
    """
    Endpoint générique pour tout autre système de téléphonie.
    """
    try:
        data = await request.json()
        result = process_webhook(data, source="auto")
        
        return create_webhook_response(True, "Webhook processed", result)
    
    except Exception as e:
        return create_webhook_response(False, f"Error: {str(e)}")
