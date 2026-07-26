import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
import jwt

from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        # Create dir if not exists
        os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def create_access_token(data: dict) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm="HS256")
    return encoded_jwt

class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = "User"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(req: AuthRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")
        
    email = str(req.email).lower().strip()
    users = load_users()
    if email in users:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    salt = secrets.token_hex(16)
    hashed = hash_password(req.password, salt)
    
    users[email] = {
        "email": email,
        "name": req.name,
        "salt": salt,
        "password": hashed,
        "tier": "free",
        "credits_used_today": 0,
        "last_credit_reset": datetime.now(timezone.utc).isoformat(),
        "stripe_customer_id": None,
        "is_admin": email == "ashuthoshkumar808@gmail.com"
    }
    
    save_users(users)
    
    token = create_access_token({"sub": email})
    return {
        "success": True, 
        "message": "User registered successfully", 
        "token": token,
        "user": {
            "email": email, 
            "name": req.name,
            "tier": "free",
            "is_admin": email == "ashuthoshkumar808@gmail.com"
        }
    }

@router.post("/login")
async def login(req: LoginRequest):
    email = str(req.email).lower().strip()
    users = load_users()
    user = users.get(email)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    hashed = hash_password(req.password, user["salt"])
    
    if hashed != user["password"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    token = create_access_token({"sub": email})
    
    return {
        "success": True, 
        "message": "Login successful", 
        "token": token,
        "user": {
            "email": user["email"], 
            "name": user.get("name", "User"),
            "tier": user.get("tier", "free"),
            "is_admin": user.get("is_admin", user["email"] == "ashuthoshkumar808@gmail.com")
        }
    }

# This has to be imported here to avoid circular imports
from app.api.v1.middleware import get_current_user

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "email": current_user["email"],
            "name": current_user.get("name", "User"),
            "tier": current_user.get("tier", "free"),
            "is_admin": current_user.get("is_admin", current_user["email"] == "ashuthoshkumar808@gmail.com"),
            "credits_used_today": current_user.get("credits_used_today", 0)
        }
    }
