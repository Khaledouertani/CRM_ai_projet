"""
services/sms.py
===============
SMS Notifications - Gateway integration for SMS alerts.

Supports:
- Twilio
- Generic HTTP SMS API
- Custom SMS gateway configuration

Usage:
    from services.sms import send_sms
    send_sms("+33612345678", "Your appointment is tomorrow at 14h")
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()


def send_sms_twilio(to_phone: str, message: str) -> dict:
    """
    Envoie un SMS via Twilio.
    
    Nécessite les variables d'environnement:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_PHONE_NUMBER
    """
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not all([account_sid, auth_token, from_number]):
            return {
                "success": False,
                "error": "Missing Twilio credentials"
            }
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        
        data = {
            "To": to_phone,
            "From": from_number,
            "Body": message
        }
        
        response = requests.post(
            url,
            data=data,
            auth=(account_sid, auth_token),
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return {
                "success": True,
                "message_id": response.json().get("sid"),
                "status": "sent"
            }
        else:
            return {
                "success": False,
                "error": response.json().get("message", "Unknown error")
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def send_sms_generic(to_phone: str, message: str) -> dict:
    """
    Envoie un SMS via une API HTTP générique.
    
    Nécessite les variables d'environnement:
    - SMS_API_URL
    - SMS_API_KEY (optionnel)
    - SMS_SENDER_NAME
    """
    try:
        api_url = os.getenv("SMS_API_URL")
        api_key = os.getenv("SMS_API_KEY")
        sender = os.getenv("SMS_SENDER_NAME", "CRM_AI")
        
        if not api_url:
            return {
                "success": False,
                "error": "Missing SMS_API_URL configuration"
            }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        payload = {
            "to": to_phone,
            "message": message,
            "from": sender
        }
        
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201, 202]:
            return {
                "success": True,
                "status": "sent"
            }
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def send_sms(to_phone: str, message: str) -> dict:
    """
    Envoie un SMS en utilisant le provider configuré.
    Ordre de priorité: Twilio > Generic API
    """
    if os.getenv("TWILIO_ACCOUNT_SID"):
        return send_sms_twilio(to_phone, message)
    elif os.getenv("SMS_API_URL"):
        return send_sms_generic(to_phone, message)
    else:
        return {
            "success": False,
            "error": "No SMS provider configured. Set TWILIO_* or SMS_API_URL in .env"
        }


def send_appointment_reminder(to_phone: str, customer_name: str, appointment_date: str, agent_name: str = "") -> dict:
    """
    Envoie un rappel de rendez-vous par SMS.
    """
    message = f"Rappel: Votre rendez-vous avec {agent_name or 'notre équipe'} est prévu {appointment_date}. Confirmez ou reporter au 0800 XXX XXXX"
    return send_sms(to_phone, message)


def send_followup_reminder(to_phone: str, customer_name: str, agent_name: str) -> dict:
    """
    Envoie un SMS de relance après un appel sans engagement.
    """
    message = f"Bonjour {customer_name}, {agent_name} vous rappelle suite à notre conversation. Pour toute question, contactez-nous au 0800 XXX XXXX"
    return send_sms(to_phone, message)


def send_alert_to_agent(agent_phone: str, alert_type: str, message: str) -> dict:
    """
    Envoie une alerte à un agent (superviseur).
    """
    full_message = f"[ALERTE CRM] {alert_type}: {message}"
    return send_sms(agent_phone, full_message)
