"""
Agricultural calendar service.
Calculates optimal planting dates, transplant times, and harvest dates
based on crop rules, climate zones, and user location.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from calendar import monthrange
from sqlalchemy.orm import Session, joinedload

from app.infrastructure.database.models import (
    LoteSemillas, Variedad, Especie, Plantacion, CropRule, User
)


class CalendarService:
    """
    Service for generating agricultural calendar based on lotes and climate data.
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
        
        # Get user's lotes with variedad and especie data
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == user.id,
            LoteSemillas.estado == "activo"
        ).options(
            joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        for lote in lotes:
            especie = lote.variedad.especie
            variedad = lote.variedad
            
            # Check if this month is good for indoor planting
            if especie.meses_siembra_interior and month in especie.meses_siembra_interior:
                tasks["planting"].append({
                    "lote_id": lote.id,
                    "nombre": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variedad": variedad.nombre_variedad,
                    "type": "indoor",
                    "description": f"Siembra interior de {especie.nombre_comun} - {variedad.nombre_variedad}"
                })
            
            # Check if this month is good for outdoor planting
            if especie.meses_siembra_exterior and month in especie.meses_siembra_exterior:
                tasks["planting"].append({
                    "lote_id": lote.id,
                    "nombre": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variedad": variedad.nombre_variedad,
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
            especie = plantacion.lote_semillas.variedad.especie
            
            # Check for transplanting tasks
            if plantacion.estado == "germinada" and especie.dias_hasta_trasplante:
                transplant_date = plantacion.fecha_siembra + timedelta(days=especie.dias_hasta_trasplante)
                if transplant_date.month == month and transplant_date.year == year:
                    tasks["transplanting"].append({
                        "plantacion_id": plantacion.id,
                        "nombre": plantacion.nombre_plantacion,
                        "date": transplant_date,
                        "description": f"Trasplante de {plantacion.nombre_plantacion}"
                    })
            
            # Check for harvesting tasks
            if plantacion.fecha_cosecha_estimada:
                harvest_date = plantacion.fecha_cosecha_estimada
                if harvest_date.month == month and harvest_date.year == year:
                    tasks["harvesting"].append({
                        "plantacion_id": plantacion.id,
                        "nombre": plantacion.nombre_plantacion,
                        "date": harvest_date,
                        "description": f"Cosecha de {plantacion.nombre_plantacion}"
                    })
        
        # Check for expiration reminders (30 days before)
        for lote in lotes:
            if lote.fecha_vencimiento:
                warning_date = lote.fecha_vencimiento - timedelta(days=30)
                if warning_date.month == month and warning_date.year == year:
                    tasks["reminders"].append({
                        "lote_id": lote.id,
                        "nombre": lote.nombre_comercial,
                        "type": "expiration_warning",
                        "description": f"{lote.nombre_comercial} caduca el {lote.fecha_vencimiento.strftime('%d/%m/%Y')}",
                        "expiration_date": lote.fecha_vencimiento
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
            List of lotes that can be planted this month
        """
        now = datetime.now()
        current_month = now.month
        
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == user.id,
            LoteSemillas.estado == "activo"
        ).options(
            joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        recommendations = []
        
        for lote in lotes:
            especie = lote.variedad.especie
            can_plant_indoor = especie.meses_siembra_interior and current_month in especie.meses_siembra_interior
            can_plant_outdoor = especie.meses_siembra_exterior and current_month in especie.meses_siembra_exterior
            
            if can_plant_indoor or can_plant_outdoor:
                recommendations.append({
                    "lote_id": lote.id,
                    "nombre": lote.nombre_comercial,
                    "especie": especie.nombre_comun,
                    "variedad": lote.variedad.nombre_variedad,
                    "can_plant_indoor": can_plant_indoor,
                    "can_plant_outdoor": can_plant_outdoor,
                    "germination_days_min": especie.dias_germinacion_min,
                    "germination_days_max": especie.dias_germinacion_max
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
            especie = plantacion.lote_semillas.variedad.especie
            if especie.dias_hasta_trasplante:
                transplant_date = plantacion.fecha_siembra + timedelta(days=especie.dias_hasta_trasplante)
                if now <= transplant_date <= end_date:
                    days_until = (transplant_date - now).days
                    upcoming.append({
                        "plantacion_id": plantacion.id,
                        "nombre": plantacion.nombre_plantacion,
                        "especie": especie.nombre_comun,
                        "transplant_date": transplant_date,
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
            LoteSemillas.estado == "activo"
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
