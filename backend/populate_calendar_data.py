#!/usr/bin/env python3
"""
Script to populate calendar data for varieties.
Adds planting months (interior and exterior) to varieties.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import Variedad, Especie
import json

def populate_calendar_data():
    """Add calendar planting data to varieties"""
    db = SessionLocal()
    
    try:
        # Define planting months for common vegetables
        # Interior: [1,2,3] = Enero, Febrero, Marzo (winter sowing)
        # Exterior: [4,5,6] = Abril, Mayo, Junio (spring sowing)
        
        calendar_data = {
            # Tomatoes - start indoors early, transplant outside later
            "Tomate": {
                "interior": [2, 3, 4],  # Febrero-Abril
                "exterior": [5, 6],     # Mayo-Junio
                "dias_germinacion_min": 5,
                "dias_germinacion_max": 10,
                "dias_hasta_trasplante": 45,
                "dias_hasta_cosecha_min": 60,
                "dias_hasta_cosecha_max": 85
            },
            # Peppers - need warm start
            "Pimiento": {
                "interior": [2, 3, 4],
                "exterior": [5, 6],
                "dias_germinacion_min": 7,
                "dias_germinacion_max": 14,
                "dias_hasta_trasplante": 50,
                "dias_hasta_cosecha_min": 70,
                "dias_hasta_cosecha_max": 90
            },
            # Lettuce - cool weather crop
            "Lechuga": {
                "interior": [1, 2, 3, 8, 9],
                "exterior": [3, 4, 5, 9, 10],
                "dias_germinacion_min": 4,
                "dias_germinacion_max": 7,
                "dias_hasta_trasplante": 20,
                "dias_hasta_cosecha_min": 45,
                "dias_hasta_cosecha_max": 60
            },
            # Carrots - direct sow
            "Zanahoria": {
                "interior": [],
                "exterior": [3, 4, 5, 6, 7],
                "dias_germinacion_min": 10,
                "dias_germinacion_max": 21,
                "dias_hasta_trasplante": None,
                "dias_hasta_cosecha_min": 70,
                "dias_hasta_cosecha_max": 80
            },
            # Cucumbers - warm weather
            "Pepino": {
                "interior": [3, 4],
                "exterior": [5, 6],
                "dias_germinacion_min": 3,
                "dias_germinacion_max": 7,
                "dias_hasta_trasplante": 21,
                "dias_hasta_cosecha_min": 50,
                "dias_hasta_cosecha_max": 70
            },
            # Beans - direct sow, warm weather
            "Judías": {
                "interior": [],
                "exterior": [5, 6, 7],
                "dias_germinacion_min": 5,
                "dias_germinacion_max": 10,
                "dias_hasta_trasplante": None,
                "dias_hasta_cosecha_min": 50,
                "dias_hasta_cosecha_max": 65
            },
            # Spinach - cool weather
            "Espinaca": {
                "interior": [1, 2, 3, 8, 9],
                "exterior": [3, 4, 5, 8, 9, 10],
                "dias_germinacion_min": 6,
                "dias_germinacion_max": 14,
                "dias_hasta_trasplante": 20,
                "dias_hasta_cosecha_min": 40,
                "dias_hasta_cosecha_max": 50
            },
            # Basil - warm weather herb
            "Albahaca": {
                "interior": [3, 4],
                "exterior": [5, 6],
                "dias_germinacion_min": 5,
                "dias_germinacion_max": 10,
                "dias_hasta_trasplante": 30,
                "dias_hasta_cosecha_min": 50,
                "dias_hasta_cosecha_max": 65
            },
            # Cilantro - cool weather herb
            "Cilantro": {
                "interior": [2, 3, 8, 9],
                "exterior": [3, 4, 5, 9, 10],
                "dias_germinacion_min": 7,
                "dias_germinacion_max": 14,
                "dias_hasta_trasplante": None,
                "dias_hasta_cosecha_min": 45,
                "dias_hasta_cosecha_max": 70
            },
            # Calabacín - warm weather
            "Calabacín": {
                "interior": [3, 4],
                "exterior": [5, 6],
                "dias_germinacion_min": 3,
                "dias_germinacion_max": 7,
                "dias_hasta_trasplante": 21,
                "dias_hasta_cosecha_min": 45,
                "dias_hasta_cosecha_max": 55
            }
        }
        
        updated_count = 0
        
        # Get all especies with their variedades
        especies = db.query(Especie).all()
        
        for especie in especies:
            # Check if this especie matches any of our calendar data
            especie_data = None
            for common_name, data in calendar_data.items():
                if common_name.lower() in especie.nombre_comun.lower():
                    especie_data = data
                    break
            
            if especie_data:
                # Update all variedades of this especie
                variedades = db.query(Variedad).filter(Variedad.especie_id == especie.id).all()
                
                for variedad in variedades:
                    variedad.meses_siembra_interior = especie_data["interior"]
                    variedad.meses_siembra_exterior = especie_data["exterior"]
                    variedad.dias_germinacion_min = especie_data["dias_germinacion_min"]
                    variedad.dias_germinacion_max = especie_data["dias_germinacion_max"]
                    variedad.dias_hasta_trasplante = especie_data["dias_hasta_trasplante"]
                    variedad.dias_hasta_cosecha_min = especie_data["dias_hasta_cosecha_min"]
                    variedad.dias_hasta_cosecha_max = especie_data["dias_hasta_cosecha_max"]
                    
                    updated_count += 1
                    print(f"✓ Updated: {especie.nombre_comun} - {variedad.nombre_variedad}")
        
        db.commit()
        print(f"\n✓ Successfully updated {updated_count} varieties with calendar data")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Populating calendar data for varieties...")
    print("-" * 50)
    populate_calendar_data()

