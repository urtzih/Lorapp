"""
Script para importar datos de Square Foot Gardening desde CSV.
Puebla la tabla square_foot_gardening con los 3 métodos de plantación.

Uso:
    python import_sfg_from_csv.py
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


def import_sfg_data(csv_path: str):
    """
    Importa datos de SFG desde el CSV proporcionado.
    
    Formato CSV esperado:
    name,sfgOriginal,sfgMultisow,sfgMacizo
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
                'created': 0,
                'updated': 0,
                'not_found': 0,
                'errors': []
            }
            
            for row in reader:
                stats['processed'] += 1
                plant_name = row['name'].strip()
                
                # Parsear valores (pueden estar vacíos)
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
                
                # Skip si no hay datos
                if all(v is None for v in [plantas_original, plantas_multisow, plantas_macizo]):
                    stats['errors'].append(f"⚠ {plant_name}: Sin datos SFG")
                    continue
                
                # Buscar especie por nombre común (normalizado para búsqueda flexible)
                normalized_search = normalize_name(plant_name)
                
                # Intentar búsqueda exacta primero usando solo columnas existentes
                # Usar text para consulta SQL directa que solo selecciona columnas que existen
                from sqlalchemy import text
                result = db.execute(
                    text("SELECT id, nombre_comun, square_foot_spacing FROM especies WHERE LOWER(nombre_comun) LIKE LOWER(:nombre)"),
                    {"nombre": f"%{plant_name}%"}
                ).first()
                
                especie_id = None
                especie_nombre = plant_name
                especie_spacing = None
                if result:
                    especie_id = result[0]
                    especie_nombre = result[1]
                    especie_spacing = result[2]
                
                # Si no se encuentra, intentar búsqueda más flexible
                if not especie_id:
                    all_especies = db.execute(text("SELECT id, nombre_comun, square_foot_spacing FROM especies")).fetchall()
                    for e_id, e_nombre, e_spacing in all_especies:
                        if normalized_search in normalize_name(e_nombre):
                            especie_id = e_id
                            especie_nombre = e_nombre
                            especie_spacing = e_spacing
                            break
                
                if not especie_id:
                    stats['not_found'] += 1
                    stats['errors'].append(f"⚠ No encontrado: {plant_name}")
                    continue
                
                # Verificar si ya existe registro SFG
                sfg_existing = db.query(SquareFootGardening).filter(
                    SquareFootGardening.especie_id == especie_id
                ).first()
                
                if sfg_existing:
                    # Actualizar
                    sfg_existing.plantas_original = plantas_original or sfg_existing.plantas_original
                    sfg_existing.plantas_multisow = plantas_multisow or sfg_existing.plantas_multisow
                    sfg_existing.plantas_macizo = plantas_macizo or sfg_existing.plantas_macizo
                    stats['updated'] += 1
                    print(f"✓ Actualizado: {especie_nombre} (Orig: {plantas_original}, Multi: {plantas_multisow}, Macizo: {plantas_macizo})")
                else:
                    # Crear nuevo
                    sfg_new = SquareFootGardening(
                        especie_id=especie_id,
                        plantas_original=plantas_original,
                        plantas_multisow=plantas_multisow,
                        plantas_macizo=plantas_macizo,
                        espaciado_cm=especie_spacing  # Migrar espaciado si existe
                    )
                    db.add(sfg_new)
                    stats['created'] += 1
                    print(f"✓ Creado: {especie_nombre} (Orig: {plantas_original}, Multi: {plantas_multisow}, Macizo: {plantas_macizo})")
            
            # Commit all changes
            db.commit()
            
            # Mostrar resumen
            print("\n" + "="*60)
            print("📊 RESUMEN DE IMPORTACIÓN")
            print("="*60)
            print(f"✓ Registros procesados: {stats['processed']}")
            print(f"✓ Creados: {stats['created']}")
            print(f"✓ Actualizados: {stats['updated']}")
            print(f"⚠ No encontrados: {stats['not_found']}")
            
            if stats['errors']:
                print(f"\n⚠ Errores y advertencias ({len(stats['errors'])}):")
                for error in stats['errors'][:20]:  # Mostrar máximo 20
                    print(f"  {error}")
                if len(stats['errors']) > 20:
                    print(f"  ... y {len(stats['errors']) - 20} más")
            
            print("\n✅ Importación completada exitosamente")
            
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante la importación: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Buscar el archivo CSV en el mismo directorio del script
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plants_sfg.csv")
    
    if not os.path.exists(csv_path):
        print(f"❌ No se encontró el archivo CSV en: {csv_path}")
        print("Por favor, coloca el archivo plants_sfg.csv en el mismo directorio que este script")
        sys.exit(1)
    
    print("🌱 Importando datos de Square Foot Gardening desde CSV...")
    print(f"📁 Archivo: {csv_path}\n")
    
    import_sfg_data(csv_path)
