"""
Integrated Weather + Lunar Calendar endpoints
Combines astronomical and meteorological data for agricultural planning.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, date, timedelta
from calendar import monthrange

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User
from app.application.services.lunar_api_service import LunarApiService
from app.application.services.weather_cache_service import WeatherCacheService

router = APIRouter(prefix="/calendar-integrated", tags=["Integrated Calendar"])


@router.get("/month/{year}/{month}")
async def get_integrated_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete integrated calendar for a specific month.
    Combines lunar phases, weather forecast, and plantable seeds.
    
    Returns day-by-day data with:
    - Lunar phases (moon_phase, illumination, moonrise/set)
    - Weather (temp_min/max, precipitation_mm, chance_of_rain, condition)
    - Agricultural info (plantable_seeds count, viabilidad, days_to_harvest)
    """
    
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    # Get days in month
    _, days_in_month = monthrange(year, month)
    
    # Build complete month view
    integrated_month = {
        "year": year,
        "month": month,
        "location": location,
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        },
        "days": [],
        "summary": {
            "total_plantable_seeds": 0,
            "avg_temp_c": 0,
            "total_precipitation_mm": 0,
            "rainy_days": 0
        }
    }
    
    temps = []
    rains = []
    plantable_count = 0
    
    for day in range(1, days_in_month + 1):
        target_date = date(year, month, day)
        
        # Get lunar data
        lunar_data = await LunarApiService.get_lunar_data_for_date(
            target_date=target_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        # Get weather data
        weather_data = await WeatherCacheService.get_weather_for_date(
            target_date=target_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        # Count plantable seeds (simplified - would come from calendar_service)
        # For now, just add a placeholder
        plantable_today = 0  # Would query calendar_service.get_plantable_seeds(target_date)
        if plantable_today > 0:
            plantable_count += plantable_today
        
        # Compile day data
        day_data = {
            "day": day,
            "date": target_date.isoformat(),
            "day_name": target_date.strftime("%A"),
            "lunar": {
                "phase": lunar_data["moon_phase"],
                "illumination": lunar_data["moon_illumination"],
                "moonrise": lunar_data.get("moonrise"),
                "moonset": lunar_data.get("moonset"),
                "sunrise": lunar_data.get("sunrise"),
                "sunset": lunar_data.get("sunset")
            },
            "weather": {
                "temperature": {
                    "max_c": weather_data["daily"].get("max_temp_c"),
                    "min_c": weather_data["daily"].get("min_temp_c"),
                    "avg_c": weather_data["daily"].get("avg_temp_c")
                },
                "precipitation": {
                    "mm": weather_data["daily"].get("total_precipitation_mm"),
                    "chance_of_rain": weather_data["daily"].get("chance_of_rain")
                },
                "condition": weather_data["daily"].get("condition"),
                "wind_kph": weather_data["current"].get("wind_kph"),
                "humidity": weather_data["current"].get("humidity"),
                "uv_index": weather_data["daily"].get("uv_index")
            },
            "plantable_seeds": plantable_today
        }
        
        integrated_month["days"].append(day_data)
        
        # Accumulate stats
        if weather_data["daily"].get("avg_temp_c"):
            temps.append(weather_data["daily"]["avg_temp_c"])
        
        rain_mm = weather_data["daily"].get("total_precipitation_mm", 0)
        if rain_mm:
            rains.append(rain_mm)
            if rain_mm > 0.5:
                integrated_month["summary"]["rainy_days"] += 1
    
    # Calculate summary stats
    if temps:
        integrated_month["summary"]["avg_temp_c"] = round(sum(temps) / len(temps), 1)
    if rains:
        integrated_month["summary"]["total_precipitation_mm"] = round(sum(rains), 1)
    
    integrated_month["summary"]["total_plantable_seeds"] = plantable_count
    
    return integrated_month


@router.get("/week-forecast")
async def get_week_forecast(
    start_date: date = Query(None),
    days: int = Query(7, ge=3, le=14),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed week forecast combining lunar + weather data.
    Perfect for agricultural planning decisions.
    
    Includes: Temperature range, precipitation, moon phases, sunrise/sunset times.
    """
    
    if start_date is None:
        start_date = date.today()
    
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    # Pre-fetch weather week data
    weather_forecast = await WeatherCacheService.prefetch_week_data(
        start_date=start_date,
        num_days=days,
        location=location,
        latitude=latitude,
        longitude=longitude,
        db=db
    )
    
    # Add lunar data for each day
    forecast_with_lunar = {
        "location": location,
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        },
        "forecast_period": {
            "start_date": start_date.isoformat(),
            "end_date": (start_date + timedelta(days=days-1)).isoformat(),
            "days": days
        },
        "daily_data": []
    }
    
    for day_forecast in weather_forecast["daily_data"]:
        day_date = datetime.fromisoformat(day_forecast["date"]).date()
        
        lunar_data = await LunarApiService.get_lunar_data_for_date(
            target_date=day_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        forecast_with_lunar["daily_data"].append({
            "date": day_forecast["date"],
            "day": day_forecast["day"],
            "temperature": {
                "max_c": day_forecast["temp_max"],
                "min_c": day_forecast["temp_min"]
            },
            "weather": {
                "condition": day_forecast["condition"],
                "precipitation_mm": day_forecast["precipitation_mm"],
                "chance_of_rain": day_forecast["chance_of_rain"],
                "uv_index": day_forecast["uv_index"]
            },
            "lunar": {
                "phase": lunar_data["moon_phase"],
                "illumination": lunar_data["moon_illumination"]
            }
        })
    
    return forecast_with_lunar


@router.get("/planting-advisory")
async def get_planting_advisory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get smart planting recommendations based on:
    - Current and forecast weather conditions
    - Lunar phases (best planting windows)
    - Available seeds in user's inventory
    
    Returns prioritized list of recommended plantings.
    """
    
    today = date.today()
    next_14_days = today + timedelta(days=14)
    
    # Get user's location
    location = current_user.location or "Vitoria-Gasteiz,Spain"
    latitude = current_user.latitude or 42.8467
    longitude = current_user.longitude or -2.6716
    
    advisory = {
        "generated_at": datetime.now().isoformat(),
        "location": location,
        "forecast_period": {
            "start_date": today.isoformat(),
            "end_date": next_14_days.isoformat()
        },
        "recommendations": {
            "high_priority": [],  # Ideal conditions
            "medium_priority": [],  # Acceptable conditions
            "low_priority": []  # Suboptimal but possible
        },
        "weather_summary": {
            "overall_condition": "variable",
            "best_planting_days": []
        }
    }
    
    # Analyze each day in next 14 days
    best_days = []
    for day_offset in range(14):
        target_date = today + timedelta(days=day_offset)
        
        weather = await WeatherCacheService.get_weather_for_date(
            target_date=target_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        lunar = await LunarApiService.get_lunar_data_for_date(
            target_date=target_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            db=db
        )
        
        # Scoring criteria
        temp = weather["daily"].get("avg_temp_c", 15)
        is_good_temp = 10 <= temp <= 25  # Optimal range
        
        rain_chance = weather["daily"].get("chance_of_rain", 50)
        is_good_moisture = 20 <= rain_chance <= 80  # Not too dry, not too wet
        
        is_waxing = "Waxing" in lunar["moon_phase"]  # Preferred for planting
        illumination = lunar["moon_illumination"]
        
        # Calculate priority score
        score = 0
        score += 50 if is_good_temp else 20
        score += 30 if is_good_moisture else 10
        score += 20 if is_waxing else 10
        
        day_rec = {
            "date": target_date.isoformat(),
            "day_name": target_date.strftime("%A"),
            "conditions": {
                "temperature_c": round(temp, 1),
                "precipitation_risk": rain_chance,
                "condition": weather["daily"].get("condition"),
                "lunar_phase": lunar["moon_phase"],
                "moon_illumination": round(illumination, 1)
            },
            "suitability_score": score
        }
        
        if score >= 80:
            advisory["recommendations"]["high_priority"].append(day_rec)
            best_days.append(target_date.isoformat())
        elif score >= 50:
            advisory["recommendations"]["medium_priority"].append(day_rec)
        else:
            advisory["recommendations"]["low_priority"].append(day_rec)
    
    advisory["weather_summary"]["best_planting_days"] = best_days[:5]
    
    return advisory
