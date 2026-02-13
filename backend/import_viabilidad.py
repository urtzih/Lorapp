"""
Script para importar datos de viabilidad de semillas desde CSV
"""
import csv
import sys
from datetime import datetime
from pathlib import Path

# Agregar el directorio app al path
sys.path.insert(0, str(Path(__file__).parent))

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import LoteSemillas
from sqlalchemy import update

def import_viabilidad_csv(csv_path):
    """
    Importa los datos de anos_viabilidad_semilla desde un CSV.
    
    CSV esperado con columnas: ID, anos_viabilidad_semilla, nivel_viabilidad
    """
    db = SessionLocal()
    updated_count = 0
    errors = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for idx, row in enumerate(reader, start=2):
                try:
                    lote_id = int(row['ID'])
                    anos_viabilidad = int(row['anos_viabilidad_semilla'])
                    
                    # Buscar el lote
                    lote = db.query(LoteSemillas).filter(LoteSemillas.id == lote_id).first()
                    
                    if lote:
                        lote.anos_viabilidad_semilla = anos_viabilidad
                        db.commit()
                        updated_count += 1
                        print(f"✓ Lote {lote_id}: actualizado a {anos_viabilidad} años de viabilidad")
                    else:
                        error_msg = f"Lote {lote_id} no encontrado"
                        errors.append((idx, error_msg))
                        print(f"✗ {error_msg}")
                        
                except ValueError as e:
                    error_msg = f"Valores inválidos en fila: {str(e)}"
                    errors.append((idx, error_msg))
                    print(f"✗ {error_msg}")
                except Exception as e:
                    error_msg = f"Error al procesar: {str(e)}"
                    errors.append((idx, error_msg))
                    print(f"✗ {error_msg}")
        
        print(f"\n=== RESULTADOS ===")
        print(f"✓ Lotes actualizados: {updated_count}")
        print(f"✗ Errores: {len(errors)}")
        
        if errors:
            print(f"\nErrores encontrados:")
            for line_num, error in errors:
                print(f"  Línea {line_num}: {error}")
        
        return updated_count, errors
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python import_viabilidad.py <ruta_csv>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    if not Path(csv_file).exists():
        print(f"Error: Archivo {csv_file} no encontrado")
        sys.exit(1)
    
    print(f"Importando datos desde {csv_file}...")
    updated, errors = import_viabilidad_csv(csv_file)
    
    if errors:
        sys.exit(1)
    else:
        print(f"\nImportación completada exitosamente!")
        sys.exit(0)
