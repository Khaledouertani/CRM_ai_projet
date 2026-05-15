from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from services.auth_service import verify_token
from services.messages_service import (
    get_conversations_for_user,
    get_messages as fetch_messages,
    save_message,
    mark_message_as_read
)
from controllers.ws_routes import manager

router = APIRouter(prefix="/api/messages", tags=["messages"])

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    is_urgent: bool = False

def get_current_user_from_header(authorization: Optional[str]) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    user_info = verify_token(parts[1])
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_info

@router.get("/conversations")
def get_conversations(authorization: Optional[str] = Header(None)):
    user = get_current_user_from_header(authorization)
    return get_conversations_for_user(user["id"])

@router.get("/{other_user_id}")
def get_messages(other_user_id: int, authorization: Optional[str] = Header(None)):
    user = get_current_user_from_header(authorization)
    return fetch_messages(user["id"], other_user_id)

@router.post("")
async def send_message(message: MessageCreate, authorization: Optional[str] = Header(None)):
    user = get_current_user_from_header(authorization)
    saved_msg = save_message(
        sender_id=user["id"], 
        receiver_id=message.receiver_id, 
        content=message.content, 
        is_urgent=message.is_urgent
    )
    
    # Notify recipient via WebSocket
    await manager.send_personal_message(
        {"type": "new_message", "data": saved_msg}, 
        message.receiver_id
    )
    
    return saved_msg

@router.put("/{message_id}/read")
async def mark_as_read(message_id: int, authorization: Optional[str] = Header(None)):
    get_current_user_from_header(authorization)
    mark_message_as_read(message_id)
    return {"success": True}