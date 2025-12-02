"""
User profile and settings API routes.
Handles user profile management and preferences updates.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import UserUpdate, UserResponse, MessageResponse
from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information.
    
    Requires authentication.
    """
    return UserResponse.from_orm(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile information.
    
    - **name**: User's full name
    - **location**: Address or place name
    - **latitude/longitude**: GPS coordinates for agricultural calendar
    - **climate_zone**: Climate zone for planting recommendations
    - **language**: Preferred language (es/eu)
    - **notifications_enabled**: Enable/disable notifications
    
    All fields are optional. Only provided fields will be updated.
    """
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)


@router.put("/preferences", response_model=MessageResponse)
async def update_preferences(
    language: str = None,
    notifications_enabled: bool = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user preferences (quick update endpoint).
    
    - **language**: Preferred language (es/eu)
    - **notifications_enabled**: Enable/disable notifications
    """
    if language is not None:
        if language not in ["es", "eu"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Language must be 'es' or 'eu'"
            )
        current_user.language = language
    
    if notifications_enabled is not None:
        current_user.notifications_enabled = notifications_enabled
    
    db.commit()
    
    return MessageResponse(message="Preferences updated successfully")
