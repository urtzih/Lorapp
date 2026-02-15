"""
Script para importar datos de Square Foot Gardening desde CSV.
Importa las 374 plantas del archivo plants_sfg.csv a la base de datos.
"""

import os
import sys
import csv
from pathlib import Path

# Añadir el directorio raíz al path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import Especie, SquareFootGardening


def import_sfg_plants():
    """Importar plantas de SFG desde CSV."""
    db: Session = SessionLocal()
    
    try:
        # Buscar CSV primero en el directorio raíz del proyecto, luego en /app
        csv_path = backend_dir.parent / 'plants_sfg.csv'
        if not csv_path.exists():
            csv_path = Path('/app/plants_sfg.csv')
        
        if not csv_path.exists():
            print(f"❌ Error: No se encontró el archivo {csv_path}")
            return
            
        print(f"📂 Leyendo archivo: {csv_path}")
        
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                plant_name = row['name'].strip()
                
                if not plant_name:
                    continue
                    
                # Buscar si ya existe la especie
                especie = db.query(Especie).filter(
                    Especie.nombre_comun == plant_name
                ).first()
                
                # Si no existe, crear nueva especie
                if not especie:
                    especie = Especie(
                        nombre_comun=plant_name,
                        tipo_cultivo='SFG'  # Marcamos como plantas SFG
                    )
                    db.add(especie)
                    db.flush()  # Para obtener el ID
                    imported_count += 1
                    print(f"✅ Nueva especie: {plant_name} (ID: {especie.id})")
                else:
                    print(f"♻️  Ya existe: {plant_name} (ID: {especie.id})")
                
                # Verificar si ya tiene datos de SFG
                sfg_data = db.query(SquareFootGardening).filter(
                    SquareFootGardening.especie_id == especie.id
                ).first()
                
                # Parsear valores numéricos del CSV
                try:
                    plantas_original = int(row['sfgOriginal']) if row['sfgOriginal'].strip() else None
                except (ValueError, AttributeError):
                    plantas_original = None
                    
                try:
                    plantas_multisow = int(row['sfgMultisow']) if row['sfgMultisow'].strip() else None
                except (ValueError, AttributeError):
                    plantas_multisow = None
                    
                try:
                    plantas_macizo = int(row['sfgMacizo']) if row['sfgMacizo'].strip() else None
                except (ValueError, AttributeError):
                    plantas_macizo = None
                
                # Si no tiene datos de SFG, crearlos
                if not sfg_data:
                    # Solo crear si hay al menos un valor SFG
                    if plantas_original or plantas_multisow or plantas_macizo:
                        sfg_data = SquareFootGardening(
                            especie_id=especie.id,
                            plantas_original=plantas_original,
                            plantas_multisow=plantas_multisow,
                            plantas_macizo=plantas_macizo
                        )
                        db.add(sfg_data)
                        print(f"   📊 SFG: Original={plantas_original}, Multi={plantas_multisow}, Macizo={plantas_macizo}")
                    else:
                        skipped_count += 1
                        print(f"   ⚠️  Sin datos SFG disponibles")
                else:
                    # Actualizar datos existentes si hay nuevos valores
                    if plantas_original is not None:
                        sfg_data.plantas_original = plantas_original
                    if plantas_multisow is not None:
                        sfg_data.plantas_multisow = plantas_multisow
                    if plantas_macizo is not None:
                        sfg_data.plantas_macizo = plantas_macizo
                    updated_count += 1
                    print(f"   🔄 SFG actualizado")
        
        # Commit final
        db.commit()
        
        print("\n" + "="*50)
        print("✅ Importación completada:")
        print(f"   📥 Especies nuevas: {imported_count}")
        print(f"   🔄 SFG actualizados: {updated_count}")
        print(f"   ⚠️  Sin datos SFG: {skipped_count}")
        print("="*50)
        
        # Verificar totales
        total_especies = db.query(Especie).count()
        total_sfg = db.query(SquareFootGardening).count()
        print(f"\n📊 Estado de la base de datos:")
        print(f"   Total especies: {total_especies}")
        print(f"   Total con datos SFG: {total_sfg}")
        
    except Exception as e:
        print(f"\n❌ Error durante la importación: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Iniciando importación de plantas SFG...")
    print("="*50)
    import_sfg_plants()
