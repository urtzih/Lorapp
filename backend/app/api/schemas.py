"""
Pydantic schemas for API request/response validation.
Provides data validation, serialization, and documentation for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============ User Schemas ============

class UserBase(BaseModel):
    """Base user fields shared across schemas"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    language: str = Field(default="es", pattern="^(es|eu)$")


class UserCreate(UserBase):
    """Schema for user registration with email/password"""
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Schema for login credentials"""
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication"""
    token: str = Field(..., description="Google ID token from OAuth flow")


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    climate_zone: Optional[str] = None
    language: Optional[str] = Field(None, pattern="^(es|eu)$")
    notifications_enabled: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user data in API responses"""
    id: int
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    climate_zone: Optional[str]
    notifications_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ Seed Schemas ============

class SeedBase(BaseModel):
    """Base seed fields"""
    commercial_name: str = Field(..., min_length=1, max_length=500)
    species: Optional[str] = Field(None, max_length=255)
    variety: Optional[str] = Field(None, max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    production_year: Optional[int] = Field(None, ge=1900, le=2100)
    estimated_count: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class SeedCreate(SeedBase):
    """Schema for creating a new seed entry"""
    expiration_date: Optional[datetime] = None
    photos: List[str] = Field(default_factory=list)
    
    # Agricultural parameters
    planting_depth_cm: Optional[float] = Field(None, ge=0)
    spacing_cm: Optional[float] = Field(None, ge=0)
    row_spacing_cm: Optional[float] = Field(None, ge=0)
    watering_frequency: Optional[str] = None
    sun_exposure: Optional[str] = Field(None, pattern="^(full|partial|shade)$")
    
    # Calendar data
    indoor_planting_months: List[int] = Field(default_factory=list)
    outdoor_planting_months: List[int] = Field(default_factory=list)
    germination_days: Optional[int] = Field(None, ge=0)
    days_to_transplant: Optional[int] = Field(None, ge=0)
    days_to_harvest: Optional[int] = Field(None, ge=0)
    
    crop_family: Optional[str] = None


class SeedUpdate(BaseModel):
    """Schema for updating seed information"""
    commercial_name: Optional[str] = Field(None, min_length=1, max_length=500)
    species: Optional[str] = None
    variety: Optional[str] = None
    brand: Optional[str] = None
    production_year: Optional[int] = Field(None, ge=1900, le=2100)
    expiration_date: Optional[datetime] = None
    estimated_count: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    
    planting_depth_cm: Optional[float] = None
    spacing_cm: Optional[float] = None
    row_spacing_cm: Optional[float] = None
    watering_frequency: Optional[str] = None
    sun_exposure: Optional[str] = None
    
    indoor_planting_months: Optional[List[int]] = None
    outdoor_planting_months: Optional[List[int]] = None
    germination_days: Optional[int] = None
    days_to_transplant: Optional[int] = None
    days_to_harvest: Optional[int] = None
    
    crop_family: Optional[str] = None
    is_planted: Optional[bool] = None
    planting_date: Optional[datetime] = None


class SeedResponse(SeedBase):
    """Schema for seed data in API responses"""
    id: int
    user_id: int
    expiration_date: Optional[datetime]
    photos: List[str]
    
    planting_depth_cm: Optional[float]
    spacing_cm: Optional[float]
    row_spacing_cm: Optional[float]
    watering_frequency: Optional[str]
    sun_exposure: Optional[str]
    
    indoor_planting_months: List[int]
    outdoor_planting_months: List[int]
    germination_days: Optional[int]
    days_to_transplant: Optional[int]
    days_to_harvest: Optional[int]
    
    crop_family: Optional[str]
    is_planted: bool
    planting_date: Optional[datetime]
    transplant_date: Optional[datetime]
    expected_harvest_date: Optional[datetime]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OCRResult(BaseModel):
    """Schema for OCR extraction results"""
    raw_text: str
    extracted_data: SeedCreate
    confidence: float = Field(..., ge=0, le=1)


# ============ Push Notification Schemas ============

class PushSubscriptionCreate(BaseModel):
    """Schema for creating a push notification subscription"""
    endpoint: str = Field(..., min_length=1)
    expiration_time: Optional[datetime] = None
    keys: Dict[str, str] = Field(..., description="Must contain 'p256dh' and 'auth' keys")
    
    @validator('keys')
    def validate_keys(cls, v):
        if 'p256dh' not in v or 'auth' not in v:
            raise ValueError("Keys must contain 'p256dh' and 'auth'")
        return v


class PushSubscriptionResponse(BaseModel):
    """Schema for push subscription in responses"""
    id: int
    endpoint: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationPayload(BaseModel):
    """Schema for notification content"""
    title: str = Field(..., max_length=255)
    body: str
    icon: Optional[str] = None
    badge: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# ============ Calendar Schemas ============

class CalendarTask(BaseModel):
    """Schema for a calendar task"""
    date: datetime
    task_type: str = Field(..., pattern="^(plant|transplant|harvest)$")
    seed_id: int
    seed_name: str
    description: str


class MonthlyCalendar(BaseModel):
    """Schema for monthly calendar view"""
    month: int = Field(..., ge=1, le=12)
    year: int
    tasks: List[CalendarTask]


# ============ Generic Response Schemas ============

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None
