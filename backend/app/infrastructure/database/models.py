"""
SQLAlchemy database models for all entities in Lorapp.
Defines tables for users, seeds, push subscriptions, crop rules, and notification history.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.infrastructure.database.base import Base


class User(Base):
    """
    User account model.
    Stores authentication credentials, profile information, and preferences.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    name = Column(String(255), nullable=False)
    
    # Location data for agricultural calendar
    location = Column(String(500), nullable=True)  # Address or place name
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    climate_zone = Column(String(50), nullable=True)  # e.g., "temperate", "mediterranean"
    
    # User preferences
    language = Column(String(5), default="es")  # "es" or "eu"
    notifications_enabled = Column(Boolean, default=True)
    
    # OAuth data
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    oauth_provider = Column(String(50), nullable=True)  # "google", etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    seeds = relationship("Seed", back_populates="user", cascade="all, delete-orphan")
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")


class Seed(Base):
    """
    Seed inventory model.
    Stores detailed information about each seed packet in the user's collection.
    """
    __tablename__ = "seeds"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Basic seed information (extracted from OCR)
    commercial_name = Column(String(500), nullable=False)
    species = Column(String(255), nullable=True)
    variety = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    production_year = Column(Integer, nullable=True)
    expiration_date = Column(DateTime, nullable=True)
    estimated_count = Column(Integer, nullable=True)  # Number of seeds in packet
    
    # Photos and notes
    photos = Column(JSON, default=list)  # List of file paths
    notes = Column(Text, nullable=True)
    
    # Agricultural parameters
    planting_depth_cm = Column(Float, nullable=True)
    spacing_cm = Column(Float, nullable=True)  # Distance between plants
    row_spacing_cm = Column(Float, nullable=True)  # Distance between rows
    watering_frequency = Column(String(100), nullable=True)  # e.g., "daily", "weekly"
    sun_exposure = Column(String(50), nullable=True)  # "full", "partial", "shade"
    
    # Planting calendar data
    indoor_planting_months = Column(JSON, default=list)  # List of month numbers [1, 2, 3]
    outdoor_planting_months = Column(JSON, default=list)  # List of month numbers [4, 5, 6]
    germination_days = Column(Integer, nullable=True)
    days_to_transplant = Column(Integer, nullable=True)
    days_to_harvest = Column(Integer, nullable=True)
    
    # Crop family (for filtering and grouping)
    crop_family = Column(String(100), nullable=True)  # "tomato", "lettuce", "beans", etc.
    
    # Status tracking
    is_planted = Column(Boolean, default=False)
    planting_date = Column(DateTime, nullable=True)
    transplant_date = Column(DateTime, nullable=True)
    expected_harvest_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="seeds")


class PushSubscription(Base):
    """
    Web Push notification subscription model.
    Stores browser push subscription data for each user device.
    """
    __tablename__ = "push_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Web Push subscription data
    endpoint = Column(String(500), unique=True, nullable=False)
    expiration_time = Column(DateTime, nullable=True)
    p256dh = Column(String(500), nullable=False)  # Encryption key
    auth = Column(String(500), nullable=False)  # Authentication secret
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    user_agent = Column(String(500), nullable=True)  # Browser/device info
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="push_subscriptions")


class CropRule(Base):
    """
    Agricultural rules model.
    Stores planting guidelines for different crop families and climate zones.
    """
    __tablename__ = "crop_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Crop identification
    crop_family = Column(String(100), unique=True, nullable=False, index=True)
    common_names = Column(JSON, default=list)  # List of common names in different languages
    
    # Planting windows (month numbers)
    indoor_planting_months = Column(JSON, default=list)  # [1, 2, 3] for Jan, Feb, Mar
    outdoor_planting_months = Column(JSON, default=list)  # [4, 5, 6] for Apr, May, Jun
    
    # Growth timeline
    germination_days_min = Column(Integer, nullable=True)
    germination_days_max = Column(Integer, nullable=True)
    days_to_transplant = Column(Integer, nullable=True)
    days_to_harvest_min = Column(Integer, nullable=True)
    days_to_harvest_max = Column(Integer, nullable=True)
    
    # Growing conditions
    min_temperature_c = Column(Float, nullable=True)
    max_temperature_c = Column(Float, nullable=True)
    preferred_climate_zones = Column(JSON, default=list)  # ["temperate", "mediterranean"]
    
    # Agricultural parameters
    planting_depth_cm = Column(Float, nullable=True)
    spacing_cm = Column(Float, nullable=True)
    row_spacing_cm = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NotificationHistory(Base):
    """
    Notification history model.
    Tracks all notifications sent to users for debugging and analytics.
    """
    __tablename__ = "notification_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification details
    notification_type = Column(String(100), nullable=False)  # "monthly_planting", "expiration", "transplant"
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSON, default=dict)  # Additional payload data
    
    # Delivery status
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
