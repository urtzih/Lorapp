"""
Lunar API service for fetching real-time moon phase data from WeatherAPI.com
"""

from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.orm import Session
import logging

from app.core.config import settings
from app.infrastructure.database.models import LunarDataCache

logger = logging.getLogger(__name__)


class LunarApiService:
    """
    Service for fetching and caching lunar data from WeatherAPI.com
    """
    
    BASE_URL = "http://api.weatherapi.com/v1"
    
    # Default location: Vitoria-Gasteiz
    DEFAULT_LOCATION = "Vitoria-Gasteiz,Spain"
    DEFAULT_LAT = 42.8467
    DEFAULT_LON = -2.6716
    
    @classmethod
    async def get_lunar_data_for_date(
        cls,
        target_date: date,
        location: str = None,
        latitude: float = None,
        longitude: float = None,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Get lunar data for a specific date.
        First checks cache, then fetches from API if needed.
        
        Args:
            target_date: Date to get lunar data for
            location: Location name (e.g., "Vitoria-Gasteiz,Spain")
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            db: Database session for caching
            
        Returns:
            Dictionary with lunar data
        """
        # Use default location if none provided
        if not location and not (latitude and longitude):
            location = cls.DEFAULT_LOCATION
            latitude = cls.DEFAULT_LAT
            longitude = cls.DEFAULT_LON
        
        # Check cache first
        if db:
            cached = cls._get_from_cache(target_date, location or f"{latitude},{longitude}", db)
            if cached:
                logger.info(f"Lunar data found in cache for {target_date}")
                return cached
        
        # Fetch from API
        logger.info(f"Fetching lunar data from API for {target_date}")
        api_data = await cls._fetch_from_api(target_date, location, latitude, longitude)
        
        # Cache the result
        if db and api_data:
            cls._save_to_cache(target_date, location, latitude, longitude, api_data, db)
        
        return api_data
    
    @classmethod
    async def prefetch_month_data(
        cls,
        year: int,
        month: int,
        location: str = None,
        latitude: float = None,
        longitude: float = None,
        db: Session = None
    ):
        """
        Pre-fetch lunar data for an entire month (async background task).
        
        Args:
            year: Year
            month: Month (1-12)
            location: Location name
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            db: Database session
        """
        from calendar import monthrange
        
        # Use default location if none provided
        if not location and not (latitude and longitude):
            location = cls.DEFAULT_LOCATION
            latitude = cls.DEFAULT_LAT
            longitude = cls.DEFAULT_LON
        
        _, days_in_month = monthrange(year, month)
        
        logger.info(f"Pre-fetching lunar data for {year}-{month:02d} ({days_in_month} days)")
        
        for day in range(1, days_in_month + 1):
            target_date = date(year, month, day)
            
            # Skip if already cached
            if db:
                location_key = location or f"{latitude},{longitude}"
                if cls._get_from_cache(target_date, location_key, db):
                    continue
            
            try:
                await cls.get_lunar_data_for_date(
                    target_date, location, latitude, longitude, db
                )
                # Small delay to avoid rate limiting
                await cls._sleep(0.1)
            except Exception as e:
                logger.error(f"Error fetching lunar data for {target_date}: {e}")
    
    @classmethod
    async def _fetch_from_api(
        cls,
        target_date: date,
        location: str = None,
        latitude: float = None,
        longitude: float = None
    ) -> Dict[str, Any]:
        """
        Fetch lunar data from WeatherAPI.com
        """
        # Get API key from settings
        api_key = getattr(settings, 'WEATHER_API_KEY', None)
        if not api_key:
            logger.warning("WEATHER_API_KEY not configured, using fallback calculation")
            return cls._fallback_calculation(target_date)
        
        # Build query parameter
        if location:
            query = location
        elif latitude and longitude:
            query = f"{latitude},{longitude}"
        else:
            query = cls.DEFAULT_LOCATION
        
        url = f"{cls.BASE_URL}/astronomy.json"
        params = {
            "key": api_key,
            "q": query,
            "dt": target_date.strftime("%Y-%m-%d")
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                # Extract relevant data
                astro = data.get("astronomy", {}).get("astro", {})[0] if data.get("astronomy", {}).get("astro") else {}
                
                return {
                    "date": target_date.isoformat(),
                    "location": data.get("location", {}).get("name", query),
                    "moon_phase": astro.get("moon_phase", "Unknown"),
                    "moon_illumination": float(astro.get("moon_illumination", 0)),
                    "moonrise": astro.get("moonrise"),
                    "moonset": astro.get("moonset"),
                    "sunrise": astro.get("sunrise"),
                    "sunset": astro.get("sunset"),
                    "raw_data": data
                }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching lunar data: {e}")
            return cls._fallback_calculation(target_date)
        except Exception as e:
            logger.error(f"Error fetching lunar data: {e}")
            return cls._fallback_calculation(target_date)
    
    @classmethod
    def _fallback_calculation(cls, target_date: date) -> Dict[str, Any]:
        """
        Fallback to local calculation if API is unavailable
        """
        from app.application.services.lunar_calendar import lunar_calendar
        
        dt = datetime.combine(target_date, datetime.min.time())
        phase_data = lunar_calendar.get_moon_phase(dt)
        
        return {
            "date": target_date.isoformat(),
            "location": cls.DEFAULT_LOCATION,
            "moon_phase": phase_data["phase_display"].split()[0],  # Extract phase name
            "moon_illumination": phase_data["illumination"],
            "moonrise": None,
            "moonset": None,
            "sunrise": None,
            "sunset": None,
            "raw_data": None
        }
    
    @classmethod
    def _get_from_cache(
        cls,
        target_date: date,
        location: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """Get cached lunar data"""
        cached = db.query(LunarDataCache).filter(
            LunarDataCache.date == target_date,
            LunarDataCache.location == location
        ).first()
        
        if cached:
            return {
                "date": cached.date.isoformat(),
                "location": cached.location,
                "moon_phase": cached.moon_phase,
                "moon_illumination": cached.moon_illumination,
                "moonrise": cached.moonrise,
                "moonset": cached.moonset,
                "sunrise": cached.sunrise,
                "sunset": cached.sunset,
                "raw_data": cached.raw_data
            }
        return None
    
    @classmethod
    def _save_to_cache(
        cls,
        target_date: date,
        location: str,
        latitude: float,
        longitude: float,
        data: Dict[str, Any],
        db: Session
    ):
        """Save lunar data to cache"""
        try:
            cached = LunarDataCache(
                date=target_date,
                location=location or f"{latitude},{longitude}",
                latitude=latitude or cls.DEFAULT_LAT,
                longitude=longitude or cls.DEFAULT_LON,
                moon_phase=data.get("moon_phase", "Unknown"),
                moon_illumination=data.get("moon_illumination", 0),
                moonrise=data.get("moonrise"),
                moonset=data.get("moonset"),
                sunrise=data.get("sunrise"),
                sunset=data.get("sunset"),
                raw_data=data.get("raw_data")
            )
            db.add(cached)
            db.commit()
            logger.info(f"Saved lunar data to cache for {target_date}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving to cache: {e}")
    
    @staticmethod
    async def _sleep(seconds: float):
        """Async sleep helper"""
        import asyncio
        await asyncio.sleep(seconds)
