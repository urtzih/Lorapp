"""
Geolocation Service
Converts location names to coordinates and determines climate zones.
Uses OpenStreetMap Nominatim API (free, no authentication required).
"""

import httpx
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class GeolocationService:
    """Service for location geocoding and climate zone determination"""
    
    NOMINATIM_API = "https://nominatim.openstreetmap.org"
    
    # Climate zone mappings by latitude
    CLIMATE_ZONES = {
        "tropical": (0, 23.5),           # 0° to 23.5°
        "mediterranean": (30, 45),        # ~30° to 45° (warm/dry summers)
        "temperate": (35, 60),            # ~35° to 60° (moderate)
        "continental": (45, 70),          # ~45° to 70° (cold winters)
        "polar": (66.5, 90),              # Above Arctic Circle
    }
    
    @staticmethod
    async def geocode_location(location: str) -> Optional[Dict[str, float]]:
        """
        Convert location name to coordinates using Nominatim.
        
        Args:
            location: City name or address (e.g., "Vitoria-Gasteiz, Spain")
            
        Returns:
            Dict with 'latitude' and 'longitude', or None if not found
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{GeolocationService.NOMINATIM_API}/search",
                    params={
                        "q": location,
                        "format": "json",
                        "limit": 1,
                        "email": "app@lorapp.local"  # Required by Nominatim
                    }
                )
                
                if response.status_code != 200 or not response.json():
                    logger.warning(f"Geocoding failed for location: {location}")
                    return None
                
                result = response.json()[0]
                return {
                    "latitude": float(result["lat"]),
                    "longitude": float(result["lon"]),
                    "display_name": result.get("display_name", location)
                }
                
        except Exception as e:
            logger.error(f"Geocoding error for '{location}': {e}")
            return None
    
    @staticmethod
    def determine_climate_zone(latitude: float) -> str:
        """
        Determine climate zone based on latitude.
        
        Args:
            latitude: Geographic latitude (-90 to 90)
            
        Returns:
            Climate zone name
        """
        abs_lat = abs(latitude)
        
        # Check polar zones first
        if abs_lat >= 66.5:
            return "polar"
        
        # Check other zones
        for zone, (min_lat, max_lat) in GeolocationService.CLIMATE_ZONES.items():
            if min_lat <= abs_lat <= max_lat:
                return zone
        
        # Default to temperate if no match
        return "temperate"
    
    @staticmethod
    def get_planting_months_for_climate(
        climate_zone: str,
        latitude: float
    ) -> Dict[str, list]:
        """
        Get recommended planting months based on climate zone and latitude.
        This is a simplified model - in production would be species-specific.
        
        Args:
            climate_zone: Climate zone name
            latitude: Latitude for Northern/Southern hemisphere adjustment
            
        Returns:
            Dict with 'interior' and 'exterior' planting months
        """
        
        # Base planting months by climate (Northern hemisphere - months 1-12)
        climate_months = {
            "tropical": {
                "interior": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
                "exterior": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            },
            "mediterranean": {
                "interior": [1, 2, 3, 9, 10, 11],        # Winter/fall
                "exterior": [3, 4, 5, 9, 10, 11]        # Spring/fall
            },
            "temperate": {
                "interior": [1, 2, 3, 8, 9],              # Late winter/early spring
                "exterior": [4, 5, 6, 9, 10]             # Spring/fall
            },
            "continental": {
                "interior": [2, 3],                       # Late winter
                "exterior": [5, 6, 9]                    # Late spring/early fall
            },
            "polar": {
                "interior": [3, 4],                       # Short season
                "exterior": [6, 7]                       # Summer only
            }
        }
        
        months = climate_months.get(climate_zone, climate_months["temperate"])
        
        # Adjust for Southern hemisphere (negative latitude)
        if latitude < 0:
            # Shift months by 6 (opposite seasons)
            interior = [(m + 6 - 1) % 12 + 1 for m in months["interior"]]
            exterior = [(m + 6 - 1) % 12 + 1 for m in months["exterior"]]
            return {"interior": interior, "exterior": exterior}
        
        return months


# Module-level function for convenience
async def geocode_and_determine_climate(
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    climate_zone: Optional[str] = None
) -> Dict[str, any]:
    """
    Complete geolocation workflow.
    
    Args:
        location: Location name
        latitude: Optional latitude (uses geocoding if None)
        longitude: Optional longitude (uses geocoding if None)
        climate_zone: Optional climate zone (auto-determined if None)
        
    Returns:
        Dict with latitude, longitude, climate_zone, and display_name
    """
    result = {
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "climate_zone": climate_zone,
        "display_name": location
    }
    
    # If coordinates not provided, try to geocode
    if latitude is None or longitude is None:
        geocoded = await GeolocationService.geocode_location(location)
        if geocoded:
            result["latitude"] = geocoded["latitude"]
            result["longitude"] = geocoded["longitude"]
            result["display_name"] = geocoded.get("display_name", location)
    
    # If we have latitude, determine climate zone
    if result["latitude"] is not None and climate_zone is None:
        result["climate_zone"] = GeolocationService.determine_climate_zone(
            result["latitude"]
        )
    
    return result
