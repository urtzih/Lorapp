"""
API endpoint for lunar calendar visualization
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, date, timedelta
from calendar import monthrange

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User
from app.application.services.lunar_api_service import LunarApiService

router = APIRouter(prefix="/lunar", tags=["Lunar Calendar"])


@router.get("/month/{year}/{month}")
async def get_lunar_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete lunar calendar for a specific month.
    Returns day-by-day lunar phases with rise/set times.
    
    Uses user's location if set, otherwise defaults to Vitoria-Gasteiz.
    """
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    # Get days in month
    _, days_in_month = monthrange(year, month)
    
    # Fetch lunar data for each day
    lunar_days = []
    for day in range(1, days_in_month + 1):
        target_date = date(year, month, day)
        
        lunar_data = await LunarApiService.get_lunar_data_for_date(
            target_date=target_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        if lunar_data:
            lunar_days.append({
                "day": day,
                "date": target_date.isoformat(),
                "moon_phase": lunar_data["moon_phase"],
                "illumination": lunar_data["moon_illumination"],
                "moonrise": lunar_data.get("moonrise"),
                "moonset": lunar_data.get("moonset"),
                "sunrise": lunar_data.get("sunrise"),
                "sunset": lunar_data.get("sunset")
            })
    
    return {
        "year": year,
        "month": month,
        "location": location,
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        },
        "days": lunar_days
    }


@router.get("/today")
async def get_lunar_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's lunar information.
    """
    today = date.today()
    
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    lunar_data = await LunarApiService.get_lunar_data_for_date(
        target_date=today,
        location=location,
        latitude=latitude,
        longitude=longitude,
        db=db
    )
    
    return {
        "date": today.isoformat(),
        "location": location,
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        },
        "moon_phase": lunar_data["moon_phase"],
        "illumination": lunar_data["moon_illumination"],
        "moonrise": lunar_data.get("moonrise"),
        "moonset": lunar_data.get("moonset"),
        "sunrise": lunar_data.get("sunrise"),
        "sunset": lunar_data.get("sunset"),
        "is_full_moon": "Full" in lunar_data["moon_phase"],
        "is_new_moon": "New" in lunar_data["moon_phase"]
    }


@router.post("/prefetch/{year}/{month}")
async def prefetch_lunar_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Pre-fetch and cache lunar data for entire month.
    This is called automatically by background jobs, but can be triggered manually.
    """
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    await LunarApiService.prefetch_month_data(
        year=year,
        month=month,
        location=location,
        latitude=latitude,
        longitude=longitude,
        db=db
    )
    
    return {
        "status": "success",
        "message": f"Pre-fetched lunar data for {year}-{month:02d}",
        "location": location
    }
