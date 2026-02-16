"""
Core configuration module for Lorapp backend.
Loads environment variables and provides centralized settings.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses Pydantic for validation and type safety.
    """
    
    # Application Info
    APP_NAME: str = "Lorapp"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Configuration
    DATABASE_URL: str
    
    # JWT Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    # Google Cloud Vision API
    GOOGLE_APPLICATION_CREDENTIALS: str
    
    # Weather API (for lunar phases & astronomy data)
    # NOTE: Using Open-Meteo (free, unlimited) instead of WeatherAPI
    WEATHER_API_KEY: str = None  # DEPRECATED - kept for backwards compatibility
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    # Web Push Notifications (VAPID)
    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    VAPID_CLAIM_EMAIL: str
    
    # File Upload Settings
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB in bytes
    
    # CORS Settings
    FRONTEND_URL: str
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS from comma-separated string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields not defined in Settings


# Global settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/seeds", exist_ok=True)
