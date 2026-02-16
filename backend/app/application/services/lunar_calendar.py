"""
Lunar calendar utilities for agricultural planning.
Calculates moon phases and provides planting recommendations.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import math


class LunarCalendar:
    """
    Utility for lunar calendar calculations and agricultural recommendations.
    """
    
    # Known new moon date for reference (synodic month = 29.53 days)
    KNOWN_NEW_MOON = datetime(2000, 1, 6, 18, 14)  # Jan 6, 2000
    SYNODIC_MONTH = 29.530588861  # Days in a lunar cycle
    
    MOON_PHASES = {
        "new_moon": "Luna Nueva 🌑",
        "waxing_crescent": "Creciente 🌒",
        "first_quarter": "Cuarto Creciente 🌓",
        "waxing_gibbous": "Creciente Gibosa 🌔",
        "full_moon": "Luna Llena 🌕",
        "waning_gibbous": "Menguante Gibosa 🌖",
        "last_quarter": "Cuarto Menguante 🌗",
        "waning_crescent": "Menguante 🌘"
    }
    
    @classmethod
    def get_moon_phase(cls, date: datetime) -> Dict[str, Any]:
        """
        Calculate the moon phase for a given date.
        
        Args:
            date: Date to calculate moon phase for
            
        Returns:
            Dictionary with phase name, emoji, percentage, and agricultural recommendations
        """
        # Calculate days since known new moon
        days_diff = (date - cls.KNOWN_NEW_MOON).total_seconds() / 86400
        
        # Calculate current position in lunar cycle (0-1)
        cycle_position = (days_diff % cls.SYNODIC_MONTH) / cls.SYNODIC_MONTH
        
        # Convert to phase
        phase_key, phase_details = cls._get_phase_details(cycle_position)
        
        return {
            "phase": phase_key,
            "phase_display": cls.MOON_PHASES[phase_key],
            "illumination": round(phase_details["illumination"] * 100, 1),
            "is_waxing": phase_details["is_waxing"],
            "agricultural_advice": cls._get_agricultural_advice(phase_key),
            "optimal_for": cls._get_optimal_activities(phase_key)
        }
    
    @classmethod
    def _get_phase_details(cls, cycle_position: float) -> tuple:
        """Get detailed phase information from cycle position (0-1)"""
        # Calculate illumination (0 at new moon, 1 at full moon)
        if cycle_position < 0.5:
            illumination = cycle_position * 2
            is_waxing = True
        else:
            illumination = (1 - cycle_position) * 2
            is_waxing = False
        
        # Determine phase name
        if cycle_position < 0.03 or cycle_position > 0.97:
            phase = "new_moon"
        elif 0.03 <= cycle_position < 0.22:
            phase = "waxing_crescent"
        elif 0.22 <= cycle_position < 0.28:
            phase = "first_quarter"
        elif 0.28 <= cycle_position < 0.47:
            phase = "waxing_gibbous"
        elif 0.47 <= cycle_position < 0.53:
            phase = "full_moon"
        elif 0.53 <= cycle_position < 0.72:
            phase = "waning_gibbous"
        elif 0.72 <= cycle_position < 0.78:
            phase = "last_quarter"
        else:
            phase = "waning_crescent"
        
        return phase, {"illumination": illumination, "is_waxing": is_waxing}
    
    @classmethod
    def _get_agricultural_advice(cls, phase: str) -> str:
        """Get agricultural recommendations for a specific moon phase"""
        advice = {
            "new_moon": "Período de descanso. Ideal para planificar y preparar el terreno. Evita siembras importantes.",
            "waxing_crescent": "Fase de crecimiento. Excelente para sembrar cultivos de hoja (lechuga, espinaca, col).",
            "first_quarter": "Fase de vigor. Perfecto para trasplantar y sembrar cultivos que producen frutos sobre tierra.",
            "waxing_gibbous": "Fase de fuerza. Ideal para sembrar tubérculos y cultivos de raíz.",
            "full_moon": "Máxima energía. Buen momento para cosechar y sembrar cultivos de ciclo largo.",
            "waning_gibbous": "Fase decreciente. Momento ideal para podar, abonar y preparar compost.",
            "last_quarter": "Fase de reposo. Perfecto para eliminar malas hierbas y controlar plagas.",
            "waning_crescent": "Fase de descanso. Ideal para labores de mantenimiento y limpieza del huerto."
        }
        return advice.get(phase, "")
    
    @classmethod
    def _get_optimal_activities(cls, phase: str) -> list:
        """Get list of optimal activities for a specific moon phase"""
        activities = {
            "new_moon": ["Planificación", "Preparación del suelo", "Descanso"],
            "waxing_crescent": ["Siembra de hojas", "Lechuga", "Espinaca", "Col"],
            "first_quarter": ["Trasplante", "Tomates", "Pimientos", "Pepinos"],
            "waxing_gibbous": ["Tubérculos", "Zanahorias", "Patatas", "Rábanos"],
            "full_moon": ["Cosecha", "Siembra de ciclo largo", "Recolección"],
            "waning_gibbous": ["Poda", "Abonado", "Compost"],
            "last_quarter": ["Control de plagas", "Eliminación de malas hierbas"],
            "waning_crescent": ["Mantenimiento", "Limpieza", "Preparación"]
        }
        return activities.get(phase, [])
    
    @classmethod
    def get_next_moon_phases(cls, start_date: datetime, days_ahead: int = 30) -> list:
        """
        Get upcoming significant moon phases (new moon, full moon, quarters).
        
        Args:
            start_date: Starting date
            days_ahead: Number of days to look ahead
            
        Returns:
            List of significant moon phases with dates
        """
        significant_phases = []
        
        for day_offset in range(days_ahead):
            current_date = start_date + timedelta(days=day_offset)
            phase_info = cls.get_moon_phase(current_date)
            
            # Add significant phases
            if phase_info["phase"] in ["new_moon", "full_moon", "first_quarter", "last_quarter"]:
                significant_phases.append({
                    "date": current_date.date().isoformat(),
                    "phase": phase_info["phase"],
                    "phase_display": phase_info["phase_display"],
                    "optimal_for": phase_info["optimal_for"]
                })
        
        return significant_phases


# Global lunar calendar instance
lunar_calendar = LunarCalendar()

