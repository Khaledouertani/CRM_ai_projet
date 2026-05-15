"""
services/auth_service.py
========================
JWT Authentication Service for CRM AI Backend.
Handles token creation, verification, and database-backed authentication.
"""

from datetime import datetime, timedelta
from typing import Optional, List
import pymysql
import jwt
from passlib.context import CryptContext
import secrets

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET_KEY = "crm_ai_secret_key_2026_stable_do_not_change"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Check if it's already hashed
        if hashed_password.startswith("$2b$"):
            return pwd_context.verify(plain_password, hashed_password)
        # Fallback for plain text passwords (migration)
        return plain_password == hashed_password
    except:
        return False

def create_token(user_id: int, username: str, role: str) -> str:
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {
            "id": int(payload["sub"]),
            "username": payload["username"],
            "role": payload["role"]
        }
    except:
        return None

def create_reset_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(minutes=15)
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET reset_token = %s, reset_token_expiry = %s WHERE id = %s",
                (token, expiry, user_id)
            )
        conn.commit()
        return token
    finally:
        conn.close()

def verify_reset_token(token: str) -> Optional[int]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM users WHERE reset_token = %s AND reset_token_expiry > %s",
                (token, datetime.utcnow())
            )
            user = cur.fetchone()
            return user["id"] if user else None
    finally:
        conn.close()

def authenticate_user(username: str, password: str) -> Optional[dict]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, password, name, role FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            if user and verify_password(password, user['password']):
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "name": user["name"],
                    "role": user["role"],
                }
    finally:
        conn.close()
    return None

def reset_password(token: str, new_password: str) -> bool:
    user_id = verify_reset_token(token)
    if not user_id: return False
    
    hashed = hash_password(new_password)
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET password = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s",
                (hashed, user_id)
            )
        conn.commit()
        return True
    finally:
        conn.close()

def create_new_user(username: str, password: str, name: str, role: str, email: str) -> bool:
    hashed = hash_password(password)
    conn = get_db()
    try:
        with conn.cursor() as cur:
            sql = "INSERT INTO users (username, password, name, role, email) VALUES (%s, %s, %s, %s, %s)"
            cur.execute(sql, (username, hashed, name, role, email))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        return False
    finally:
        conn.close()

def delete_user(user_id: int) -> bool:
    print(f"DEBUG: delete_user CALLED for ID {user_id}")
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting user: {e}")
        return False
    finally:
        conn.close()

def update_user(user_id: int, username: str, name: str, role: str, email: str, password: Optional[str] = None) -> bool:
    print(f"DEBUG: update_user CALLED for ID {user_id}")
    conn = get_db()
    try:
        with conn.cursor() as cur:
            if password:
                hashed = hash_password(password)
                sql = "UPDATE users SET username=%s, name=%s, role=%s, email=%s, password=%s WHERE id=%s"
                cur.execute(sql, (username, name, role, email, hashed, user_id))
            else:
                sql = "UPDATE users SET username=%s, name=%s, role=%s, email=%s WHERE id=%s"
                cur.execute(sql, (username, name, role, email, user_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating user: {e}")
        return False
    finally:
        conn.close()

def get_all_users() -> List[dict]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, name, role, email, created_at FROM users")
            return cur.fetchall()
    finally:
        conn.close()

def find_user_by_email(email: str) -> Optional[dict]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, name, role, email FROM users WHERE email = %s", (email,))
            return cur.fetchone()
    finally:
        conn.close()