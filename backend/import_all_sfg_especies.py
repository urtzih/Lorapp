#!/usr/bin/env python3
"""
Script para importar TODAS las especies del CSV de SFG.
Crea las especies que no existen y luego importa los datos SFG.

Uso:
    python import_all_sfg_especies.py
"""

import csv
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.infrastructure.database.models import Especie, SquareFootGardening
from app.core.config import settings


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


def import_all_sfg_especies(csv_path: str):
    """
    Importa todas las especies del CSV de SFG.
    Si la especie no existe, la crea.
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
                'especies_created': 0,
                'especies_found': 0,
                'sfg_created': 0,
                'sfg_updated': 0,
                'errors': []
            }
            
            for row in reader:
                stats['processed'] += 1
                plant_name = row['name'].strip()
                
                # Parsear valores SFG (pueden estar vacíos)
                try:
                    plantas_original = int(row['sfgOriginal']) if row['sfgOriginal'].strip() else None
                except (ValueError, KeyError):
                    plantas_original = None
                
                try:
                    plantas_multisow = int(row['sfgMultisow']) if row['sfgMultisow'].strip() else None
                except (ValueError, KeyError):
                    plantas_multisow = None
                
                try:
                    plantas_macizo = int(row['sfgMacizo']) if row['sfgMacizo'].strip() else None
                except (ValueError, KeyError):
                    plantas_macizo = None
                
                # Skip si no hay datos SFG
                if all(v is None for v in [plantas_original, plantas_multisow, plantas_macizo]):
                    stats['errors'].append(f"⚠ {plant_name}: Sin datos SFG")
                    continue
                
                # Buscar especie por nombre común
                from sqlalchemy import text
                result = db.execute(
                    text("SELECT id FROM especies WHERE LOWER(nombre_comun) = LOWER(:nombre)"),
                    {"nombre": plant_name}
                ).first()
                
                especie_id = None
                if result:
                    especie_id = result[0]
                    stats['especies_found'] += 1
                else:
                    # Crear nueva especie
                    # Para evitar duplicados en nombre_cientifico (unique constraint),
                    # añadir sufijo "-sfg" si es necesario
                    nombre_cientifico = plant_name
                    
                    # Verificar si ya existe ese nombre científico
                    exists = db.execute(
                        text("SELECT id FROM especies WHERE nombre_cientifico = :nombre"),
                        {"nombre": nombre_cientifico}
                    ).first()
                    
                    if exists:
                        # Añadir sufijo único
                        import time
                        nombre_cientifico = f"{plant_name}-sfg-{int(time.time())}"
                    
                    nueva_especie = Especie(
                        nombre_cientifico=nombre_cientifico,
                        nombre_comun=plant_name,
                        familia_botanica="Desconocida",
                        descripcion=f"Especie importada desde SFG: {plant_name}"
                    )
                    db.add(nueva_especie)
                    db.flush()  # Para obtener el ID
                    especie_id = nueva_especie.id
                    stats['especies_created'] += 1
                    print(f"+ Nueva especie: {plant_name}")
                
                # Verificar si ya existe registro SFG
                sfg_existing = db.query(SquareFootGardening).filter(
                    SquareFootGardening.especie_id == especie_id
                ).first()
                
                if sfg_existing:
                    # Actualizar
                    sfg_existing.plantas_original = plantas_original or sfg_existing.plantas_original
                    sfg_existing.plantas_multisow = plantas_multisow or sfg_existing.plantas_multisow
                    sfg_existing.plantas_macizo = plantas_macizo or sfg_existing.plantas_macizo
                    stats['sfg_updated'] += 1
                else:
                    # Crear nuevo
                    sfg_new = SquareFootGardening(
                        especie_id=especie_id,
                        plantas_original=plantas_original,
                        plantas_multisow=plantas_multisow,
                        plantas_macizo=plantas_macizo
                    )
                    db.add(sfg_new)
                    stats['sfg_created'] += 1
                
                if stats['processed'] % 50 == 0:
                    print(f"Procesados: {stats['processed']}...")
            
            # Commit all changes
            db.commit()
            
            # Mostrar resumen
            print("\n" + "="*60)
            print("📊 RESUMEN DE IMPORTACIÓN")
            print("="*60)
            print(f"✓ Registros CSV procesados: {stats['processed']}")
            print(f"✓ Especies nuevas creadas: {stats['especies_created']}")
            print(f"✓ Especies ya existentes: {stats['especies_found']}")
            print(f"✓ Registros SFG creados: {stats['sfg_created']}")
            print(f"✓ Registros SFG actualizados: {stats['sfg_updated']}")
            
            if stats['errors']:
                print(f"\n⚠ Errores y advertencias ({len(stats['errors'])}):")
                for error in stats['errors'][:10]:
                    print(f"  {error}")
                if len(stats['errors']) > 10:
                    print(f"  ... y {len(stats['errors']) - 10} más")
            
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
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plants_sfg.csv")
    
    if not os.path.exists(csv_path):
        print(f"❌ No se encontró el archivo CSV en: {csv_path}")
        sys.exit(1)
    
    print("🌱 Importando TODAS las especies de SFG desde CSV...")
    print(f"📁 Archivo: {csv_path}\n")
    
    import_all_sfg_especies(csv_path)
