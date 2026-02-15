"""
Script simple para importar plantas SFG usando SQL directo.
Evita problemas con el modelo ORM.
"""

import csv
import os
import sys
from pathlib import Path

# Add backend dir to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.infrastructure.database.base import SessionLocal


def import_sfg_plants():
    """Import SFG plants using direct SQL."""
    db = SessionLocal()
    
    try:
        # Find CSV
        csv_path = Path('/app/plants_sfg.csv')
        if not csv_path.exists():
            csv_path = backend_dir.parent / 'plants_sfg.csv'
        
        if not csv_path.exists():
            print(f"❌ Error: No se encontró el archivo CSV")
            return
            
        print(f"📂 Leyendo: {csv_path}")
        
        imported = 0
        updated = 0
        errors = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                plant_name = row['name'].strip()
                
                if not plant_name:
                    continue
                
                try:
                    # Check if species exists
                    result = db.execute(
                        text("SELECT id FROM especies WHERE nombre_comun = :name"),
                        {"name": plant_name}
                    ).fetchone()
                    
                    especie_id = None
                    
                    if not result:
                        # Insert new species
                        result = db.execute(
                            text("""
                                INSERT INTO especies (nombre_comun, tipo_cultivo, created_at) 
                                VALUES (:name, 'SFG', CURRENT_TIMESTAMP) 
                                RETURNING id
                            """),
                            {"name": plant_name}
                        )
                        db.flush()
                        especie_id = result.fetchone()[0]
                        imported += 1
                        print(f"✅ {plant_name} (ID: {especie_id})")
                    else:
                        especie_id = result[0]
                        print(f"♻️  {plant_name} (ID: {especie_id})")
                    
                    # Parse SFG values
                    original = int(row['sfgOriginal']) if row['sfgOriginal'].strip() else None
                    multisow = int(row['sfgMultisow']) if row['sfgMultisow'].strip() else None
                    macizo = int(row['sfgMacizo']) if row['sfgMacizo'].strip() else None
                    
                    if not (original or multisow or macizo):
                        continue
                    
                    # Check if SFG data exists
                    sfg_check = db.execute(
                        text("SELECT id FROM square_foot_gardening WHERE especie_id = :id"),
                        {"id": especie_id}
                    ).fetchone()
                    
                    if not sfg_check:
                        # Insert SFG data
                        db.execute(
                            text("""
                                INSERT INTO square_foot_gardening 
                                (especie_id, plantas_original, plantas_multisow, plantas_macizo) 
                                VALUES (:id, :original, :multisow, :macizo)
                            """),
                            {
                                "id": especie_id,
                                "original": original,
                                "multisow": multisow,
                                "macizo": macizo
                            }
                        )
                        print(f"   📊 SFG: {original}/{multisow}/{macizo}")
                    else:
                        # Update SFG data
                        db.execute(
                            text("""
                                UPDATE square_foot_gardening 
                                SET plantas_original = :original,
                                    plantas_multisow = :multisow,
                                    plantas_macizo = :macizo
                                WHERE especie_id = :id
                            """),
                            {
                                "id": especie_id,
                                "original": original,
                                "multisow": multisow,
                                "macizo": macizo
                            }
                        )
                        updated += 1
                        print(f"   🔄 SFG actualizado")
                        
                except Exception as e:
                    print(f"❌ Error con {plant_name}: {e}")
                    errors += 1
        
        db.commit()
        
        print("\n" + "="*50)
        print("✅ Importación completada:")
        print(f"   📥 Nuevas especies: {imported}")
        print(f"   🔄 SFG actualizados: {updated}")
        print(f"   ❌ Errores: {errors}")
        print("="*50)
        
        # Final counts
        total_especies = db.execute(text("SELECT COUNT(*) FROM especies")).scalar()
        total_sfg = db.execute(text("SELECT COUNT(*) FROM square_foot_gardening")).scalar()
        
        print(f"\n📊 Estado BD:")
        print(f"   Total especies: {total_especies}")
        print(f"   Con datos SFG: {total_sfg}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Importando plantas SFG...")
    print("="*50)
    import_sfg_plants()
