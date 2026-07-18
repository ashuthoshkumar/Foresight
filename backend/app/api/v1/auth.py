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
    with open(USERS_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w") as f:
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
        
    users = load_users()
    if req.email in users:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    salt = secrets.token_hex(16)
    hashed = hash_password(req.password, salt)
    
    users[req.email] = {
        "email": req.email,
        "name": req.name,
        "salt": salt,
        "password": hashed
    }
    
    save_users(users)
    
    token = create_access_token({"sub": req.email})
    return {
        "success": True, 
        "message": "User registered successfully", 
        "token": token,
        "user": {"email": req.email, "name": req.name}
    }

@router.post("/login")
async def login(req: LoginRequest):
    users = load_users()
    user = users.get(req.email)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    hashed = hash_password(req.password, user["salt"])
    
    if hashed != user["password"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    token = create_access_token({"sub": req.email})
    
    return {
        "success": True, 
        "message": "Login successful", 
        "token": token,
        "user": {"email": user["email"], "name": user.get("name", "User")}
    }

# This has to be imported here to avoid circular imports
from app.api.v1.middleware import get_current_user

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "email": current_user["email"],
            "name": current_user.get("name", "User")
        }
    }
