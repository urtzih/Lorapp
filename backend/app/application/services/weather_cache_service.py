"""
Weather caching service for agricultural calendar.
Integrates with WeatherAPI.com to fetch and cache weather data.
Falls back to local data if API unavailable.
"""

import httpx
import logging
import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.config import settings
from app.infrastructure.database.models import WeatherDataCache

import asyncio

logger = logging.getLogger(__name__)

# Default location for Vitoria-Gasteiz, Spain
DEFAULT_LOCATION = "Vitoria-Gasteiz,Spain"
DEFAULT_LAT = 42.8467
DEFAULT_LON = -2.6716

# API rate limiting
API_CALL_DELAY = 0.1  # seconds between calls


class WeatherCacheService:
    """
    Service for fetching and caching weather data.
    Provides current conditions, forecast for next 10 days, and historical summaries.
    """
    
    @staticmethod
    async def get_weather_for_date(
        target_date: date,
        location: str = DEFAULT_LOCATION,
        latitude: float = DEFAULT_LAT,
        longitude: float = DEFAULT_LON,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Get weather data for a specific date.
        Uses cache first, then fetches from API if necessary.
        
        Returns:
            {
                "date": "2026-02-16",
                "location": "Vitoria-Gasteiz,Spain",
                "coordinates": {"latitude": 42.8467, "longitude": -2.6716},
                "current": {
                    "temp_c": 8.5,
                    "temp_f": 47.3,
                    "condition": "Rainy",
                    "humidity": 85,
                    "wind_kph": 12.5,
                    "chance_of_rain": 80
                },
                "daily": {
                    "max_temp_c": 12.0,
                    "min_temp_c": 5.0,
                    "avg_temp_c": 8.5,
                    "total_precipitation_mm": 2.5,
                    "chance_of_rain": 80,
                    "sunrise": "07:15",
                    "sunset": "18:45",
                    "uv_index": 2
                },
                "forecast_3_days": [
                    {
                        "date": "2026-02-17",
                        "max_temp_c": 10,
                        "min_temp_c": 4,
                        "condition": "Cloudy",
                        "chance_of_rain": 30
                    }
                ]
            }
        """
        
        if db is None:
            # Return fallback data
            return WeatherCacheService._fallback_weather(target_date, location, latitude, longitude)
        
        # Check cache first
        cached = db.query(WeatherDataCache).filter(
            and_(
                WeatherDataCache.date == target_date,
                WeatherDataCache.location == location
            )
        ).first()
        
        if cached and cached.is_fresh():
            logger.info(f"Weather cache hit for {location} on {target_date}")
            return cached.to_dict()
        
        # Fetch from API
        weather_data = await WeatherCacheService._fetch_from_api(
            target_date, location, latitude, longitude
        )
        
        if weather_data:
            # Cache the result
            cache_entry = WeatherDataCache(
                date=target_date,
                location=location,
                latitude=latitude,
                longitude=longitude,
                temp_max=weather_data["daily"].get("max_temp_c"),
                temp_min=weather_data["daily"].get("min_temp_c"),
                temp_avg=weather_data["daily"].get("avg_temp_c"),
                condition=weather_data["daily"].get("condition"),
                humidity=weather_data["current"].get("humidity"),
                precipitation_mm=weather_data["daily"].get("total_precipitation_mm"),
                chance_of_rain=weather_data["daily"].get("chance_of_rain"),
                wind_kph=weather_data["current"].get("wind_kph"),
                uv_index=weather_data["daily"].get("uv_index"),
                raw_data=weather_data,
                cached_at=datetime.utcnow()
            )
            db.add(cache_entry)
            db.commit()
            logger.info(f"Cached weather for {location} on {target_date}")
            return weather_data
        
        # Fallback if API fails
        return WeatherCacheService._fallback_weather(target_date, location, latitude, longitude)
    
    
    @staticmethod
    async def prefetch_week_data(
        start_date: date,
        num_days: int = 7,
        location: str = DEFAULT_LOCATION,
        latitude: float = DEFAULT_LAT,
        longitude: float = DEFAULT_LON,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Pre-fetch weather data for multiple days (optimized for forecast display).
        Useful for pre-loading week data at app startup.
        
        Returns consolidated forecast data ready for UI.
        """
        
        forecast_data = {
            "location": location,
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "forecast_period": {
                "start_date": start_date.isoformat(),
                "days": num_days
            },
            "daily_data": []
        }
        
        current_date = start_date
        for day_offset in range(num_days):
            target_date = current_date + timedelta(days=day_offset)
            
            data = await WeatherCacheService.get_weather_for_date(
                target_date=target_date,
                location=location,
                latitude=latitude,
                longitude=longitude,
                db=db
            )
            
            if data:
                forecast_data["daily_data"].append({
                    "date": target_date.isoformat(),
                    "day": target_date.strftime("%A"),
                    "temp_max": data["daily"].get("max_temp_c"),
                    "temp_min": data["daily"].get("min_temp_c"),
                    "condition": data["daily"].get("condition"),
                    "precipitation_mm": data["daily"].get("total_precipitation_mm"),
                    "chance_of_rain": data["daily"].get("chance_of_rain"),
                    "uv_index": data["daily"].get("uv_index")
                })
            
            # API rate limiting
            import asyncio
            await asyncio.sleep(API_CALL_DELAY)
        
        return forecast_data
    
    
    @staticmethod
    async def _fetch_from_api(
        target_date: date,
        location: str,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch weather data from Open-Meteo (FREE, no API key required).
        Returns None if API fails.
        
        Open-Meteo advantages:
        - Completely free, no API key needed
        - No usage limits
        - Excellent data + astronomy
        - Licensed under CC BY 4.0
        """
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # Open-Meteo forecast API
                forecast_url = "https://api.open-meteo.com/v1/forecast"
                forecast_params = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset",
                    "timezone": "auto",
                    "past_days": 0,
                    "forecast_days": 10
                }
                
                forecast_response = await client.get(forecast_url, params=forecast_params)
                forecast_response.raise_for_status()
                forecast_data = forecast_response.json()
                
                # Parse and return structured data
                return WeatherCacheService._parse_openmeteo_response(
                    target_date, forecast_data, location, latitude, longitude
                )
        
        except httpx.HTTPError as e:
            logger.error(f"Open-Meteo API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching weather: {e}")
            return None
    
    
    @staticmethod
    def _parse_openmeteo_response(
        target_date: date,
        forecast_data: Dict[str, Any],
        location: str,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """Parse Open-Meteo response into our standard format."""
        
        try:
            daily = forecast_data.get("daily", {})
            dates = daily.get("time", [])
            
            # Find forecast for target date
            target_date_str = target_date.isoformat()
            day_index = None
            
            if target_date_str in dates:
                day_index = dates.index(target_date_str)
            else:
                logger.warning(f"Date {target_date_str} not found in forecast")
                return None
            
            # Get 3-day forecast for reference
            forecast_3_days = []
            for i in range(day_index + 1, min(day_index + 4, len(dates))):
                forecast_3_days.append({
                    "date": dates[i],
                    "max_temp_c": daily["temperature_2m_max"][i],
                    "min_temp_c": daily["temperature_2m_min"][i],
                    "condition": "Partly Cloudy",  # Open-Meteo doesn't provide condition codes
                    "chance_of_rain": daily.get("precipitation_probability_max", [0])[i] or 0
                })
            
            # Temperature mean for current weather
            avg_temp = daily["temperature_2m_mean"][day_index]
            
            return {
                "date": target_date.isoformat(),
                "location": location,
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "current": {
                    "temp_c": daily["temperature_2m_mean"][day_index],
                    "temp_f": (daily["temperature_2m_mean"][day_index] * 9/5) + 32,
                    "condition": "Partly Cloudy",  # Open-Meteo doesn't provide condition codes in free tier
                    "humidity": 70,  # Open-Meteo doesn't provide daily humidity in free tier
                    "wind_kph": daily.get("windspeed_10m_max", [0])[day_index] or 0,
                    "chance_of_rain": daily.get("precipitation_probability_max", [0])[day_index] or 0
                },
                "daily": {
                    "max_temp_c": daily["temperature_2m_max"][day_index],
                    "min_temp_c": daily["temperature_2m_min"][day_index],
                    "avg_temp_c": avg_temp,
                    "total_precipitation_mm": daily.get("precipitation_sum", [0])[day_index] or 0,
                    "chance_of_rain": daily.get("precipitation_probability_max", [0])[day_index] or 0,
                    "sunrise": daily.get("sunrise", ["07:00"])[day_index] or "07:00",
                    "sunset": daily.get("sunset", ["18:00"])[day_index] or "18:00",
                    "condition": "Partly Cloudy"  # Open-Meteo doesn't provide condition codes in free tier
                },
                "forecast_3_days": forecast_3_days
            }
        
        except Exception as e:
            logger.error(f"Error parsing Open-Meteo response: {e}")
            return None
    
    
    @staticmethod
    def _get_condition_from_precipitation(chance_of_rain: int) -> str:
        """Determine weather condition from precipitation probability."""
        if chance_of_rain >= 70:
            return "Rainy"
        elif chance_of_rain >= 50:
            return "Cloudy"
        elif chance_of_rain >= 30:
            return "Partly Cloudy"
        else:
            return "Clear"
    
    
    @staticmethod
    def _fallback_weather(
        target_date: date,
        location: str,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Fallback weather data when API is unavailable.
        Returns generic safe values based on hemisphere and date season.
        """
        
        # Simple seasonal fallback (Northern Hemisphere, February)
        month = target_date.month
        
        # Winter/early spring temps for northern Spain
        if month in [12, 1, 2]:  # Winter
            temp_max = 10
            temp_min = 4
            condition = "Cloudy"
            rain_chance = 60
            precipitation = 1.5
        elif month in [3, 4, 5]:  # Spring
            temp_max = 16
            temp_min = 8
            condition = "Partly Cloudy"
            rain_chance = 40
            precipitation = 1.0
        elif month in [6, 7, 8]:  # Summer
            temp_max = 25
            temp_min = 15
            condition = "Sunny"
            rain_chance = 10
            precipitation = 0.2
        else:  # Fall
            temp_max = 18
            temp_min = 10
            condition = "Cloudy"
            rain_chance = 45
            precipitation = 1.2
        
        return {
            "date": target_date.isoformat(),
            "location": location,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            },
            "current": {
                "temp_c": (temp_max + temp_min) / 2,
                "temp_f": ((temp_max + temp_min) / 2) * 9/5 + 32,
                "condition": condition,
                "humidity": 70,
                "wind_kph": 8,
                "chance_of_rain": rain_chance
            },
            "daily": {
                "max_temp_c": temp_max,
                "min_temp_c": temp_min,
                "avg_temp_c": (temp_max + temp_min) / 2,
                "total_precipitation_mm": precipitation,
                "chance_of_rain": rain_chance,
                "sunrise": "07:15",
                "sunset": "18:45",
                "condition": condition,
                "uv_index": 2
            },
            "forecast_3_days": [
                {
                    "date": (target_date + timedelta(days=1)).isoformat(),
                    "max_temp_c": temp_max + 1,
                    "min_temp_c": temp_min,
                    "condition": condition,
                    "chance_of_rain": rain_chance
                },
                {
                    "date": (target_date + timedelta(days=2)).isoformat(),
                    "max_temp_c": temp_max,
                    "min_temp_c": temp_min - 1,
                    "condition": condition,
                    "chance_of_rain": rain_chance
                },
                {
                    "date": (target_date + timedelta(days=3)).isoformat(),
                    "max_temp_c": temp_max - 1,
                    "min_temp_c": temp_min,
                    "condition": "Rainy",
                    "chance_of_rain": 75
                }
            ]
        }
