"""
Authentication API routes.
Handles user registration, login (email/password and Google OAuth), and token refresh.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, 
    GoogleAuthRequest, MessageResponse
)
from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.application.services.geolocation_service import geocode_and_determine_climate


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email, password, and location.
    
    - **email**: Valid email address (must be unique)
    - **password**: Minimum 6 characters
    - **name**: User's full name
    - **location**: City/Town name or full address (required, used for agricultural calendar)
    - **latitude**: Optional (auto-calculated from location if omitted)
    - **longitude**: Optional (auto-calculated from location if omitted)
    - **climate_zone**: Optional (auto-determined from latitude if omitted)
    - **language**: Preferred language (es/eu), defaults to 'es'
    
    Returns JWT access token and user data.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Geocode location and determine climate zone
    location_data = await geocode_and_determine_climate(
        location=user_data.location,
        latitude=user_data.latitude,
        longitude=user_data.longitude,
        climate_zone=user_data.climate_zone
    )
    
    # Warn if geocoding failed but allow registration to continue
    if location_data["latitude"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not find location '{user_data.location}'. Please try with a different address (e.g., 'Vitoria-Gasteiz, Spain')"
        )
    
    # Create new user with location data
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
        language=user_data.language,
        location=location_data.get("display_name", user_data.location),
        latitude=location_data["latitude"],
        longitude=location_data["longitude"],
        climate_zone=location_data["climate_zone"]
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate access token
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    - **email**: Registered email address
    - **password**: User's password
    
    Returns JWT access token and user data.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate with Google OAuth.
    
    - **token**: Google ID token from OAuth flow
    
    Returns JWT access token. Creates new user if first time login.
    """
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            auth_request.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Extract user information
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    
    # Find or create user
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        # Check if email exists with different auth method
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Link Google account to existing user
            user.google_id = google_id
            user.oauth_provider = "google"
        else:
            # Create new user
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                oauth_provider="google",
                language="es"
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
    
    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.from_orm(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh JWT access token.
    
    Requires valid (non-expired) JWT token in Authorization header.
    Returns new token with extended expiration.
    """
    # Generate new access token
    access_token = create_access_token(data={"sub": current_user.id, "email": current_user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(current_user)
    )
