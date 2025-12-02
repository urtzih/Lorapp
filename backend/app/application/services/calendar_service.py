"""
Agricultural calendar service.
Calculates optimal planting dates, transplant times, and harvest dates
based on crop rules, climate zones, and user location.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from calendar import monthrange
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Seed, CropRule, User


class CalendarService:
    """
    Service for generating agricultural calendar based on seeds and climate data.
    """
    
    def get_monthly_tasks(
        self,
        user: User,
        month: int,
        year: int,
        db: Session
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all agricultural tasks for a specific month.
        
        Args:
            user: User object
            month: Month number (1-12)
            year: Year
            db: Database session
            
        Returns:
            Dictionary with task lists categorized by type
        """
        tasks = {
            "planting": [],
            "transplanting": [],
            "harvesting": [],
            "reminders": []
        }
        
        # Get user's seeds
        seeds = db.query(Seed).filter(Seed.user_id == user.id).all()
        
        for seed in seeds:
            # Check if this month is good for indoor planting
            if seed.indoor_planting_months and month in seed.indoor_planting_months:
                tasks["planting"].append({
                    "seed_id": seed.id,
                    "seed_name": seed.commercial_name,
                    "type": "indoor",
                    "description": f"Siembra interior de {seed.commercial_name}",
                    "variety": seed.variety,
                    "crop_family": seed.crop_family
                })
            
            # Check if this month is good for outdoor planting
            if seed.outdoor_planting_months and month in seed.outdoor_planting_months:
                tasks["planting"].append({
                    "seed_id": seed.id,
                    "seed_name": seed.commercial_name,
                    "type": "outdoor",
                    "description": f"Siembra exterior de {seed.commercial_name}",
                    "variety": seed.variety,
                    "crop_family": seed.crop_family
                })
            
            # Check for transplanting tasks (if seed was planted)
            if seed.is_planted and seed.planting_date and seed.days_to_transplant:
                transplant_date = seed.planting_date + timedelta(days=seed.days_to_transplant)
                if transplant_date.month == month and transplant_date.year == year:
                    tasks["transplanting"].append({
                        "seed_id": seed.id,
                        "seed_name": seed.commercial_name,
                        "date": transplant_date,
                        "description": f"Trasplante de {seed.commercial_name}",
                        "variety": seed.variety
                    })
            
            # Check for harvesting tasks
            if seed.is_planted and seed.planting_date and seed.days_to_harvest:
                harvest_date = seed.planting_date + timedelta(days=seed.days_to_harvest)
                if harvest_date.month == month and harvest_date.year == year:
                    tasks["harvesting"].append({
                        "seed_id": seed.id,
                        "seed_name": seed.commercial_name,
                        "date": harvest_date,
                        "description": f"Cosecha de {seed.commercial_name}",
                        "variety": seed.variety
                    })
            
            # Check for expiration reminders (30 days before)
            if seed.expiration_date:
                warning_date = seed.expiration_date - timedelta(days=30)
                if warning_date.month == month and warning_date.year == year:
                    tasks["reminders"].append({
                        "seed_id": seed.id,
                        "seed_name": seed.commercial_name,
                        "type": "expiration_warning",
                        "description": f"{seed.commercial_name} caduca el {seed.expiration_date.strftime('%d/%m/%Y')}",
                        "expiration_date": seed.expiration_date
                    })
        
        return tasks
    
    def get_current_month_recommendations(
        self,
        user: User,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Get planting recommendations for the current month.
        Used for monthly notifications.
        
        Args:
            user: User object
            db: Database session
            
        Returns:
            List of seeds that can be planted this month
        """
        now = datetime.now()
        current_month = now.month
        
        seeds = db.query(Seed).filter(Seed.user_id == user.id).all()
        recommendations = []
        
        for seed in seeds:
            can_plant_indoor = seed.indoor_planting_months and current_month in seed.indoor_planting_months
            can_plant_outdoor = seed.outdoor_planting_months and current_month in seed.outdoor_planting_months
            
            if can_plant_indoor or can_plant_outdoor:
                recommendations.append({
                    "seed_id": seed.id,
                    "seed_name": seed.commercial_name,
                    "variety": seed.variety,
                    "can_plant_indoor": can_plant_indoor,
                    "can_plant_outdoor": can_plant_outdoor,
                    "germination_days": seed.germination_days
                })
        
        return recommendations
    
    def get_upcoming_transplants(
        self,
        user: User,
        days_ahead: int,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Get seeds that need to be transplanted in the next X days.
        
        Args:
            user: User object
            days_ahead: Number of days to look ahead
            db: Database session
            
        Returns:
            List of seeds needing transplanting
        """
        now = datetime.now()
        end_date = now + timedelta(days=days_ahead)
        
        seeds = db.query(Seed).filter(
            Seed.user_id == user.id,
            Seed.is_planted == True,
            Seed.planting_date != None,
            Seed.days_to_transplant != None
        ).all()
        
        upcoming = []
        for seed in seeds:
            transplant_date = seed.planting_date + timedelta(days=seed.days_to_transplant)
            if now <= transplant_date <= end_date:
                days_until = (transplant_date - now).days
                upcoming.append({
                    "seed_id": seed.id,
                    "seed_name": seed.commercial_name,
                    "variety": seed.variety,
                    "transplant_date": transplant_date,
                    "days_until": days_until
                })
        
        return upcoming
    
    def get_expiring_seeds(
        self,
        user: User,
        days_ahead: int,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Get seeds expiring in the next X days.
        
        Args:
            user: User object
            days_ahead: Number of days to look ahead
            db: Database session
            
        Returns:
            List of expiring seeds
        """
        now = datetime.now()
        end_date = now + timedelta(days=days_ahead)
        
        seeds = db.query(Seed).filter(
            Seed.user_id == user.id,
            Seed.expiration_date != None,
            Seed.expiration_date <= end_date
        ).all()
        
        expiring = []
        for seed in seeds:
            days_until = (seed.expiration_date - now).days
            if days_until >= 0:  # Not already expired
                expiring.append({
                    "seed_id": seed.id,
                    "seed_name": seed.commercial_name,
                    "variety": seed.variety,
                    "expiration_date": seed.expiration_date,
                    "days_until": days_until
                })
        
        return sorted(expiring, key=lambda x: x["days_until"])


# Global calendar service instance
calendar_service = CalendarService()
