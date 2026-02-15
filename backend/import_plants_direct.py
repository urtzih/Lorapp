#!/usr/bin/env python3
"""
Script para importar 374 plantas SFG desde CSV.
Usa conexión directa a PostgreSQL sin SQLAlchemy ORM para evitar problemas de columnas.
"""

import csv
import psycopg2
from pathlib import Path

# Configuración de conexión a PostgreSQL
DB_CONFIG = {
    'host': 'postgres',
    'port': 5432,
    'database': 'lorapp',
    'user': 'lorapp_user',
    'password': 'lorapp_dev_password_123'
}

def import_plants_from_csv():
    """Importar plantas desde CSV usando psycopg2 directamente."""
    
    # Buscar CSV
    csv_path = Path('/app/plants_sfg.csv')
    if not csv_path.exists():
        csv_path = Path(__file__).parent.parent / 'plants_sfg.csv'
    
    if not csv_path.exists():
        print(f"❌ Error: No se encontró {csv_path}")
        return
    
    print(f"📂 Leyendo: {csv_path}")
    
    try:
        # Conectar a PostgreSQL
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("✅ Conectado a PostgreSQL")
        
        # Leer CSV
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            imported = 0
            updated = 0
            skipped = 0
            
            for row in reader:
                name = row['name'].strip()
                if not name:
                    continue
                
                # Verificar si existe la especie
                cur.execute("SELECT id FROM especies WHERE nombre_comun = %s", (name,))
                result = cur.fetchone()
                
                if not result:
                    # Insertar nueva especie
                    cur.execute(
                        "INSERT INTO especies (nombre_comun, tipo_cultivo, created_at) VALUES (%s, %s, CURRENT_TIMESTAMP) RETURNING id",
                        (name, 'SFG')
                    )
                    especie_id = cur.fetchone()[0]
                    imported += 1
                    print(f"✅ Nueva: {name} (ID: {especie_id})")
                else:
                    especie_id = result[0]
                    print(f"♻️  Existe: {name} (ID: {especie_id})")
                
                # Parsear valores SFG
                try:
                    original = int(row['sfgOriginal']) if row['sfgOriginal'].strip() else None
                except (ValueError, KeyError):
                    original = None
                
                try:
                    multisow = int(row['sfgMultisow']) if row['sfgMultisow'].strip() else None
                except (ValueError, KeyError):
                    multisow = None
                
                try:
                    macizo = int(row['sfgMacizo']) if row['sfgMacizo'].strip() else None
                except (ValueError, KeyError):
                    macizo = None
                
                # Verificar si ya tiene datos SFG
                cur.execute("SELECT id FROM square_foot_gardening WHERE especie_id = %s", (especie_id,))
                sfg_exists = cur.fetchone()
                
                if not sfg_exists:
                    # Insertar datos SFG si hay al menos un valor
                    if original is not None or multisow is not None or macizo is not None:
                        cur.execute(
                            """INSERT INTO square_foot_gardening 
                               (especie_id, plantas_original, plantas_multisow, plantas_macizo) 
                               VALUES (%s, %s, %s, %s)""",
                            (especie_id, original, multisow, macizo)
                        )
                        print(f"   📊 SFG: {original}/{multisow}/{macizo}")
                    else:
                        skipped += 1
                        print(f"   ⚠️  Sin datos SFG")
                else:
                    # Actualizar datos existentes
                    cur.execute(
                        """UPDATE square_foot_gardening 
                           SET plantas_original = COALESCE(%s, plantas_original),
                               plantas_multisow = COALESCE(%s, plantas_multisow),
                               plantas_macizo = COALESCE(%s, plantas_macizo)
                           WHERE especie_id = %s""",
                        (original, multisow, macizo, especie_id)
                    )
                    updated += 1
                    print(f"   🔄 SFG actualizado")
        
        # Commit
        conn.commit()
        
        # Resumen
        print("\n" + "="*60)
        print("✅ IMPORTACIÓN COMPLETADA:")
        print(f"   📥 Especies nuevas: {imported}")
        print(f"   🔄 SFG actualizados: {updated}")
        print(f"   ⚠️  Sin datos SFG: {skipped}")
        print("="*60)
        
        # Verificar totales
        cur.execute("SELECT COUNT(*) FROM especies")
        total_especies = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM square_foot_gardening")
total_sfg = cur.fetchone()[0]
        
        print(f"\n📊 ESTADO DE LA BASE DE DATOS:")
        print(f"   Total especies: {total_especies}")
        print(f"   Con datos SFG: {total_sfg}")
        
        cur.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"\n❌ Error PostgreSQL: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        raise


if __name__ == "__main__":
    print("🌱 INICIANDO IMPORTACIÓN MASIVA DE PLANTAS SFG")
    print("="*60)
    import_plants_from_csv()
    print("\n🎉 ¡Proceso terminado!")
