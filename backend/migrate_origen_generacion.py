"""
Script para extraer origen y generación del campo notas
y actualizar las nuevas columnas origen y generacion
"""

import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def extract_origen(notas):
    """Extrae el origen del campo notas"""
    if not notas:
        return None
    # Busca patrón "Origen: {valor}"
    match = re.search(r'Origen:\s*([^|]+?)(?:\||$)', notas, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def extract_generacion(notas):
    """Extrae la generación del campo notas"""
    if not notas:
        return None
    # Busca patrón "Generación: {valor}"
    match = re.search(r'Generación:\s*([^|]+?)(?:\||$)', notas, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def migrate_data():
    """Migra origen y generación del campo notas a columnas específicas"""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.begin() as connection:
        # Obtener todos los lotes_semillas con notas
        result = connection.execute(text(
            "SELECT id, notas FROM lotes_semillas WHERE notas IS NOT NULL"
        ))
        
        rows = result.fetchall()
        print(f"Total de registros con notas: {len(rows)}")
        
        updated_count = 0
        
        for row_id, notas in rows:
            origen = extract_origen(notas)
            generacion = extract_generacion(notas)
            
            if origen or generacion:
                # Actualizar el registro
                connection.execute(
                    text("""
                        UPDATE lotes_semillas 
                        SET origen = :origen, generacion = :generacion
                        WHERE id = :id
                    """),
                    {
                        "origen": origen,
                        "generacion": generacion,
                        "id": row_id
                    }
                )
                updated_count += 1
                print(f"ID {row_id}: origen='{origen}', generacion='{generacion}'")
        
        print(f"\nTotal de registros actualizados: {updated_count}")

if __name__ == "__main__":
    migrate_data()
