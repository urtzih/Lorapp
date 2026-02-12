"""
Security utilities for authentication and password hashing.
Provides JWT token creation/verification and password hashing with bcrypt.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The bcrypt hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Bcrypt hashed password string
    """
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of claims to encode in the token (usually contains user_id and email)
        expires_delta: Optional custom expiration time, defaults to settings value
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Dictionary of decoded claims if valid, None if invalid or expired
    """
    try:
        print(f"[Security] Attempting to decode token: {token[:50]}...")
        print(f"[Security] Using SECRET_KEY: {settings.SECRET_KEY[:30]}...")
        print(f"[Security] Using ALGORITHM: {settings.ALGORITHM}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"[Security] Token decoded successfully: {payload}")
        return payload
    except JWTError as e:
        print(f"[Security] JWT Error: {str(e)}")
        print(f"[Security] Token: {token[:100]}...")
        return None
    except Exception as e:
        print(f"[Security] Unexpected error: {str(e)}")
        return None
