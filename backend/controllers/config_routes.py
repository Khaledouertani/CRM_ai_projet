"""
config_routes.py
==============
API routes for configuration management.
"""

from fastapi import APIRouter, Header, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
import json
import os
from services.auth_service import verify_token


def get_user(authorization: str = Header(None)) -> dict:
    """Verify token and return user."""
    user = verify_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


router = APIRouter(prefix="/api/config", tags=["config"])


def get_config_path():
    """Get path to config.json."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "config.json")


@router.get("")
async def get_config(authorization: Optional[str] = Header(None)):
    """Get current configuration."""
    user = get_user(authorization)
    
    try:
        with open(get_config_path(), "r") as f:
            config = json.load(f)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/weights")
async def update_weights(
    config_data: dict,
    authorization: Optional[str] = Header(None)
):
    """Update weights configuration."""
    user = get_user(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        with open(get_config_path(), "r") as f:
            current = json.load(f)
        
        if "weights" in config_data:
            current["weights"] = config_data["weights"]
        if "alerts" in config_data:
            current["alerts"] = config_data["alerts"]
        
        with open(get_config_path(), "w") as f:
            json.dump(current, f, indent=2)
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))