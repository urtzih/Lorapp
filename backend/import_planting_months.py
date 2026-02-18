#!/usr/bin/env python3
"""
Script para importar meses de siembra desde el CSV de Huerta Vitoria.
Actualiza los campos meses_siembra_interior y meses_siembra_exterior.

Uso:
    python import_planting_months.py
"""

import csv
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings


def parse_months(months_str):
    """
    Convierte string de meses "2,3,8,9" a lista de enteros [2,3,8,9]
    """
    if not months_str or months_str.strip() == "":
        return []
    
    try:
        return [int(m.strip()) for m in months_str.split(',')]
    except Exception as e:
        print(f"Error parseando meses '{months_str}': {e}")
        return []


def normalize_name(name: str) -> str:
    """Normaliza nombres de plantas para búsqueda flexible"""
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ñ': 'n', 'Ñ': 'N'
    }
    normalized = name.lower().strip()
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    return normalized


def import_planting_months(csv_path: str):
    """
    Importa meses de siembra desde el CSV de Huerta Vitoria.
    """
    
    # Conectar a la base de datos
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Leer CSV
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            stats = {
                'processed': 0,
                'updated': 0,
                'not_found': 0,
                'errors': []
            }
            
            for row in reader:
                stats['processed'] += 1
                plant_name = row['nombre'].strip()
                
                # Parsear meses
                meses_interior = parse_months(row.get('meses_siembra_interior', ''))
                meses_exterior = parse_months(row.get('meses_siembra_exterior', ''))
                
                # Skip si no hay datos
                if not meses_interior and not meses_exterior:
                    stats['errors'].append(f"⚠ {plant_name}: Sin datos de meses")
                    continue
                
                # Buscar especie por nombre común (exacto primero)
                result = db.execute(
                    text("SELECT id, nombre_comun FROM especies WHERE LOWER(nombre_comun) = LOWER(:nombre)"),
                    {"nombre": plant_name}
                ).first()
                
                if not result:
                    # Búsqueda flexible
                    normalized_search = normalize_name(plant_name)
                    all_especies = db.execute(
                        text("SELECT id, nombre_comun FROM especies")
                    ).fetchall()
                    
                    for e_id, e_nombre in all_especies:
                        if normalized_search == normalize_name(e_nombre):
                            result = (e_id, e_nombre)
                            break
                
                if not result:
                    stats['not_found'] += 1
                    stats['errors'].append(f"⚠ No encontrado: {plant_name}")
                    continue
                
                especie_id, especie_nombre = result
                
                # Actualizar meses usando SQL directo
                # Convertir listas Python a formato JSON string
                import json
                interior_json = json.dumps(meses_interior)
                exterior_json = json.dumps(meses_exterior)
                
                db.execute(
                    text("""
                        UPDATE especies 
                        SET meses_siembra_interior = CAST(:interior AS json),
                            meses_siembra_exterior = CAST(:exterior AS json)
                        WHERE id = :id
                    """),
                    {
                        "id": especie_id,
                        "interior": interior_json,
                        "exterior": exterior_json
                    }
                )
                
                stats['updated'] += 1
                print(f"✓ {especie_nombre}: Interior {meses_interior}, Exterior {meses_exterior}")
                
                if stats['processed'] % 50 == 0:
                    print(f"Procesados: {stats['processed']}...")
            
            # Commit all changes
            db.commit()
            
            # Mostrar resumen
            print("\n" + "="*60)
            print("📊 RESUMEN DE IMPORTACIÓN")
            print("="*60)
            print(f"✓ Registros CSV procesados: {stats['processed']}")
            print(f"✓ Especies actualizadas: {stats['updated']}")
            print(f"⚠ No encontradas: {stats['not_found']}")
            
            if stats['errors']:
                print(f"\n⚠ Errores y advertencias ({len(stats['errors'])}):")
                for error in stats['errors'][:20]:
                    print(f"  {error}")
                if len(stats['errors']) > 20:
                    print(f"  ... y {len(stats['errors']) - 20} más")
            
            print("\n✅ Importación completada exitosamente")
            
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Buscar el archivo CSV
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "huerta_vitoria_374_variedades_COMPLETO_v2.csv")
    
    if not os.path.exists(csv_path):
        print(f"❌ No se encontró el archivo CSV en: {csv_path}")
        sys.exit(1)
    
    print("🌱 Importando meses de siembra desde CSV de Huerta Vitoria...")
    print(f"📁 Archivo: {csv_path}\n")
    
    import_planting_months(csv_path)
