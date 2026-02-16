"""
Agricultural calendar service.
Calculates optimal planting dates, transplant times, and harvest dates
based on crop rules, climate zones, user location, and lunar phases.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from calendar import monthrange
from sqlalchemy.orm import Session, joinedload

from app.infrastructure.database.models import (
    LoteSemillas, Variedad, Especie, Plantacion, CropRule, User, EstadoLoteSemillas
)
from app.application.services.lunar_calendar import lunar_calendar
from app.application.services.geolocation_service import GeolocationService


class CalendarService:
    """
    Service for generating agricultural calendar based on lotes and climate data.
    """
    
    @staticmethod
    def adjust_planting_months(
        base_months: List[int],
        user_latitude: Optional[float],
        user_climate_zone: Optional[str]
    ) -> List[int]:
        """
        Adjust planting months based on user's location (latitude/climate zone).
        
        Args:
            base_months: Original months (assuming Northern hemisphere temperate)
            user_latitude: User's latitude
            user_climate_zone: User's climate zone
            
        Returns:
            Adjusted months for user's location
        """
        if not base_months:
            return []
        
        # If we have user location, adjust the months
        if user_latitude is not None and user_latitude < 0:
            # Southern hemisphere - shift months by 6
            adjusted = [(m + 6 - 1) % 12 + 1 for m in base_months]
            return sorted(adjusted)
        
        # Could add more sophisticated climate adjustments here
        # For now, return base months (works for Northern hemisphere temperate)
        return base_months
    
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
        
        # Get user's lotes with variedad and especie data
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == user.id,
            LoteSemillas.estado == EstadoLoteSemillas.ACTIVO
        ).options(
            joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        for lote in lotes:
            especie = lote.variedad.especie
            variedad = lote.variedad
            
            # Adjust planting months based on user's location
            meses_interior_ajustados = self.adjust_planting_months(
                variedad.meses_siembra_interior or [],
                user.latitude,
                user.climate_zone
            )
            meses_exterior_ajustados = self.adjust_planting_months(
                variedad.meses_siembra_exterior or [],
                user.latitude,
                user.climate_zone
            )
            
            # Check if this month is good for indoor planting
            if month in meses_interior_ajustados:
                tasks["planting"].append({
                    "lote_id": lote.id,
                    "seed_name": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variety": variedad.nombre_variedad,
                    "type": "indoor",
                    "description": f"Siembra interior de {especie.nombre_comun} - {variedad.nombre_variedad}"
                })
            
            # Check if this month is good for outdoor planting
            if month in meses_exterior_ajustados:
                tasks["planting"].append({
                    "lote_id": lote.id,
                    "seed_name": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variety": variedad.nombre_variedad,
                    "type": "outdoor",
                    "description": f"Siembra exterior de {especie.nombre_comun} - {variedad.nombre_variedad}"
                })
        
        # Get user's plantaciones
        plantaciones = db.query(Plantacion).filter(
            Plantacion.usuario_id == user.id,
            Plantacion.estado.in_(["sembrada", "germinada", "trasplantada", "crecimiento"])
        ).options(
            joinedload(Plantacion.lote_semillas).joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        for plantacion in plantaciones:
            lote = plantacion.lote_semillas
            variedad = lote.variedad
            especie = variedad.especie
            
            # Check for transplanting tasks
            if plantacion.estado == "germinada" and variedad.dias_hasta_trasplante:
                transplant_date = plantacion.fecha_siembra + timedelta(days=variedad.dias_hasta_trasplante)
                if transplant_date.month == month and transplant_date.year == year:
                    tasks["transplanting"].append({
                        "plantacion_id": plantacion.id,
                        "seed_name": plantacion.nombre_plantacion,
                        "variety": variedad.nombre_variedad,
                        "date": transplant_date.isoformat() if transplant_date else None,
                        "description": f"Trasplante de {plantacion.nombre_plantacion}"
                    })
            
            # Check for harvesting tasks
            if plantacion.fecha_cosecha_estimada:
                harvest_date = plantacion.fecha_cosecha_estimada
                if harvest_date.month == month and harvest_date.year == year:
                    lote_variedad = plantacion.lote_semillas.variedad if plantacion.lote_semillas else None
                    tasks["harvesting"].append({
                        "plantacion_id": plantacion.id,
                        "seed_name": plantacion.nombre_plantacion,
                        "variety": lote_variedad.nombre_variedad if lote_variedad else None,
                        "date": harvest_date.isoformat() if harvest_date else None,
                        "description": f"Cosecha de {plantacion.nombre_plantacion}"
                    })
        
        # Check for expiration reminders (30 days before)
        for lote in lotes:
            if lote.fecha_vencimiento:
                warning_date = lote.fecha_vencimiento - timedelta(days=30)
                if warning_date.month == month and warning_date.year == year:
                    tasks["reminders"].append({
                        "lote_id": lote.id,
                        "seed_name": lote.nombre_comercial,
                        "variety": lote.variedad.nombre_variedad if lote.variedad else None,
                        "type": "expiration_warning",
                        "description": f"{lote.nombre_comercial} caduca el {lote.fecha_vencimiento.strftime('%d/%m/%Y')}",
                        "expiration_date": lote.fecha_vencimiento.isoformat() if lote.fecha_vencimiento else None
                    })
        
        return tasks
    
    def get_lunar_info_for_month(
        self,
        month: int,
        year: int
    ) -> Dict[str, Any]:
        """
        Get lunar information for a specific month.
        
        Args:
            month: Month number (1-12)
            year: Year
            
        Returns:
            Dictionary with current moon phase and upcoming significant phases
        """
        # Get current date for this month (1st of the month)
        month_start = datetime(year, month, 1)
        days_in_month = monthrange(year, month)[1]
        
        # Get current moon phase
        current_phase = lunar_calendar.get_moon_phase(datetime.now())
        
        # Get significant moon phases for this month
        significant_phases = []
        for day in range(1, days_in_month + 1):
            date = datetime(year, month, day)
            phase_info = lunar_calendar.get_moon_phase(date)
            
            # Include significant phases
            if phase_info["phase"] in ["new_moon", "full_moon", "first_quarter", "last_quarter"]:
                # Check if we haven't already added this phase
                if not significant_phases or significant_phases[-1]["phase"] != phase_info["phase"]:
                    significant_phases.append({
                        "date": date.date().isoformat(),
                        "day": day,
                        "phase": phase_info["phase"],
                        "phase_display": phase_info["phase_display"],
                        "optimal_for": phase_info["optimal_for"],
                        "advice": phase_info["agricultural_advice"]
                    })
        
        return {
            "current_phase": current_phase,
            "significant_phases": significant_phases
        }
    
    
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
            List of lotes that can be planted this month
        """
        now = datetime.now()
        current_month = now.month
        
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == user.id,
            LoteSemillas.estado == EstadoLoteSemillas.ACTIVO
        ).options(
            joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        recommendations = []
        
        for lote in lotes:
            variedad = lote.variedad
            especie = variedad.especie
            
            # Adjust planting months based on user's location
            meses_interior_ajustados = self.adjust_planting_months(
                variedad.meses_siembra_interior or [],
                user.latitude,
                user.climate_zone
            )
            meses_exterior_ajustados = self.adjust_planting_months(
                variedad.meses_siembra_exterior or [],
                user.latitude,
                user.climate_zone
            )
            
            can_plant_indoor = current_month in meses_interior_ajustados
            can_plant_outdoor = current_month in meses_exterior_ajustados
            
            if can_plant_indoor or can_plant_outdoor:
                # Calculate average germination days for display
                germination_days = None
                if variedad.dias_germinacion_min and variedad.dias_germinacion_max:
                    germination_days = (variedad.dias_germinacion_min + variedad.dias_germinacion_max) // 2
                elif variedad.dias_germinacion_min:
                    germination_days = variedad.dias_germinacion_min
                elif variedad.dias_germinacion_max:
                    germination_days = variedad.dias_germinacion_max
                    
                recommendations.append({
                    "lote_id": lote.id,
                    "seed_name": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variety": variedad.nombre_variedad,
                    "can_plant_indoor": can_plant_indoor,
                    "can_plant_outdoor": can_plant_outdoor,
                    "germination_days": germination_days,
                    "germination_days_min": variedad.dias_germinacion_min,
                    "germination_days_max": variedad.dias_germinacion_max,
                    "cantidad_disponible": lote.cantidad_restante or lote.cantidad_estimada or 0
                })
        
        return recommendations
    
    def get_upcoming_transplants(
        self,
        user: User,
        days_ahead: int,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Get plantaciones that need to be transplanted in the next X days.
        
        Args:
            user: User object
            days_ahead: Number of days to look ahead
            db: Database session
            
        Returns:
            List of plantaciones needing transplanting
        """
        now = datetime.now()
        end_date = now + timedelta(days=days_ahead)
        
        plantaciones = db.query(Plantacion).filter(
            Plantacion.usuario_id == user.id,
            Plantacion.estado == "germinada"
        ).options(
            joinedload(Plantacion.lote_semillas).joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        upcoming = []
        for plantacion in plantaciones:
            lote = plantacion.lote_semillas
            variedad = lote.variedad
            especie = variedad.especie
            if variedad.dias_hasta_trasplante:
                transplant_date = plantacion.fecha_siembra + timedelta(days=variedad.dias_hasta_trasplante)
                if now <= transplant_date <= end_date:
                    days_until = (transplant_date - now).days
                    upcoming.append({
                        "plantacion_id": plantacion.id,
                        "seed_name": plantacion.nombre_plantacion,
                        "especie": especie.nombre_comun,
                        "variety": variedad.nombre_variedad,
                        "transplant_date": transplant_date.isoformat() if transplant_date else None,
                        "days_until": days_until
                    })
        
        return upcoming
    
    def get_expiring_lotes(
        self,
        user: User,
        days_ahead: int,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Get lotes expiring in the next X days.
        
        Args:
            user: User object
            days_ahead: Number of days to look ahead
            db: Database session
            
        Returns:
            List of expiring lotes
        """
        now = datetime.now()
        end_date = now + timedelta(days=days_ahead)
        
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == user.id,
            LoteSemillas.fecha_vencimiento != None,
            LoteSemillas.fecha_vencimiento <= end_date,
            LoteSemillas.estado == EstadoLoteSemillas.ACTIVO
        ).options(
            joinedload(LoteSemillas.variedad)
        ).all()
        
        expiring = []
        for lote in lotes:
            days_until = (lote.fecha_vencimiento - now).days
            if days_until >= 0:  # Not already expired
                expiring.append({
                    "lote_id": lote.id,
                    "nombre": lote.nombre_comercial,
                    "variedad": lote.variedad.nombre_variedad,
                    "expiration_date": lote.fecha_vencimiento,
                    "days_until": days_until
                })
        
        return sorted(expiring, key=lambda x: x["days_until"])


# Global calendar service instance
calendar_service = CalendarService()
