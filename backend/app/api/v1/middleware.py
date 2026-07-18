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
