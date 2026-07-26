"""Authentication middleware and dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict, Any, Optional

from app.config import get_settings

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """Dependency to get the current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    settings = get_settings()
    
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        from app.api.v1.auth import load_users
        users = load_users()
        user = users.get(email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Ensure backwards compatibility for legacy users
        if "is_admin" not in user:
            user["is_admin"] = email == "ashuthoshkumar808@gmail.com"
        if "tier" not in user:
            user["tier"] = "free"
            
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """Dependency to get the user if authenticated, else None."""
    if not credentials:
        return None
        
    token = credentials.credentials
    settings = get_settings()
    
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email:
            from app.api.v1.auth import load_users
            users = load_users()
            return users.get(email)
    except Exception:
        pass
        
    return None

from datetime import datetime, timezone

def verify_credits_or_pro(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to check if user has credits left or is on Pro/Admin tier."""
    if current_user.get("is_admin", False) or current_user.get("tier") == "pro":
        return current_user
        
    from app.api.v1.auth import load_users, save_users
    email = current_user["email"]
    
    users = load_users()
    user = users.get(email)
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Check if we need to reset credits (new day)
    last_reset = user.get("last_credit_reset")
    now = datetime.now(timezone.utc)
    
    if not last_reset or datetime.fromisoformat(last_reset).date() < now.date():
        user["credits_used_today"] = 0
        user["last_credit_reset"] = now.isoformat()
        
    # Check if they have credits left
    credits_used = user.get("credits_used_today", 0)
    if credits_used >= 3:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Daily free limit reached. Upgrade to Pro for unlimited access."
        )
        
    # Increment credit
    user["credits_used_today"] = credits_used + 1
    save_users(users)
    
    return user

def verify_pro_or_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency for features strictly limited to Pro users or Admins."""
    if current_user.get("is_admin", False) or current_user.get("tier") == "pro":
        return current_user
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This feature is restricted to Pro users and Admins."
    )
