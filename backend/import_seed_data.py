#!/usr/bin/env python3
"""
Script para importar datos de semillas desde CSVs a la base de datos.
Limpia todos los datos existentes e importa los datos de terceros:
- especies.csv
- variedades.csv
- lotes_semillas.csv

Uso:
    python import_seed_data.py [usuario_nombre]
    
Ejemplo:
    python import_seed_data.py Urtzi
"""

import csv
import sys
import os
from datetime import datetime
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.infrastructure.database.models import (
    User, Especie, Variedad, LoteSemillas, EstadoLoteSemillas
)


# ============================================================================
# MAPPING FUNCTIONS FOR ENUM VALUES
# ============================================================================

def map_frecuencia_riego(valor):
    """Map CSV frequency values to ENUM values"""
    if not valor:
        return None
    
    mapping = {
        'Alta': 'diario',
        'Media-Alta': 'semanal',
        'Media': 'semanal',
        'Baja': 'cada_dos_semanas',
        'diario': 'diario',
        'cada_dos_dias': 'cada_dos_dias',
        'semanal': 'semanal',
        'cada_dos_semanas': 'cada_dos_semanas',
        'mensual': 'mensual'
    }
    return mapping.get(valor)


def map_exposicion_solar(valor):
    """Map CSV exposure values to ENUM values"""
    if not valor:
        return None
    
    mapping = {
        'Sol pleno': 'total',
        'Sol-Semisol': 'parcial',
        'Semisol': 'parcial',
        'Sombra': 'sombra',
        'total': 'total',
        'parcial': 'parcial',
        'sombra': 'sombra'
    }
    return mapping.get(valor)


# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================

def get_db_session():
    """Create and return a database session"""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def find_or_create_user(session, usuario_nombre):
    """Find user by name or create if doesn't exist"""
    user = session.query(User).filter(User.name == usuario_nombre).first()
    if not user:
        print(f"⚠️  Usuario '{usuario_nombre}' no encontrado, creando...")
        # Create user with email based on name
        email = f"{usuario_nombre.lower()}@lorapp.local"
        user = User(
            name=usuario_nombre,
            email=email,
            language="es"
        )
        session.add(user)
        session.commit()
        print(f"✅ Usuario creado: {user.name} (ID: {user.id}) con email: {email}")
    else:
        print(f"✅ Usuario encontrado: {user.name} (ID: {user.id})")
    return user


def clean_database(session):
    """Clean all seed-related data from database"""
    print("\n🧹 Limpiando base de datos...")
    
    # Delete in correct order due to foreign keys
    session.query(LoteSemillas).delete()
    session.query(Variedad).delete()
    session.query(Especie).delete()
    
    session.commit()
    print("✅ Base de datos limpiada")


# ============================================================================
# IMPORT FUNCTIONS
# ============================================================================

def import_especies(session, csv_path):
    """Import especies from CSV"""
    print(f"\n📥 Importando especies desde {csv_path}...")
    
    especies_data = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            especie = Especie(
                id=int(row['id']),
                nombre_comun=row['nombre_comun'],
                nombre_cientifico=row['nombre_cientifico'],
                familia_botanica=row['familia_botanica'],
                genero=row['genero'],
                descripcion=row.get('descripcion', ''),
                tipo_cultivo=row.get('tipo_cultivo', '')
            )
            session.add(especie)
            especies_data[especie.id] = especie
    
    session.commit()
    print(f"✅ {len(especies_data)} especies importadas")
    return especies_data


def import_variedades(session, csv_path):
    """Import variedades from CSV"""
    print(f"\n📥 Importando variedades desde {csv_path}...")
    
    variedades_data = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse temperature and other numeric values
            try:
                temp_min = float(row['temperatura_minima_c'])
            except (ValueError, KeyError):
                temp_min = None
            
            try:
                temp_max = float(row['temperatura_maxima_c'])
            except (ValueError, KeyError):
                temp_max = None
            
            try:
                dias_germ_min = int(row['dias_germinacion_min'])
            except (ValueError, KeyError):
                dias_germ_min = None
            
            try:
                dias_germ_max = int(row['dias_germinacion_max'])
            except (ValueError, KeyError):
                dias_germ_max = None
            
            try:
                dias_cosecha_min = int(row['dias_hasta_cosecha_min'])
            except (ValueError, KeyError):
                dias_cosecha_min = None
            
            try:
                dias_cosecha_max = int(row['dias_hasta_cosecha_max'])
            except (ValueError, KeyError):
                dias_cosecha_max = None
            
            try:
                prof_siembra = float(row['profundidad_siembra_cm'])
            except (ValueError, KeyError):
                prof_siembra = None
            
            try:
                dist_plantas = float(row['distancia_plantas_cm'])
            except (ValueError, KeyError):
                dist_plantas = None
            
            try:
                dist_surcos = float(row['distancia_surcos_cm'])
            except (ValueError, KeyError):
                dist_surcos = None
            
            # Map ENUM values
            frecuencia_riego = map_frecuencia_riego(row.get('frecuencia_riego'))
            exposicion_solar = map_exposicion_solar(row.get('exposicion_solar'))
            
            variedad = Variedad(
                id=int(row['id']),
                especie_id=int(row['especie_id']),
                nombre_variedad=row['nombre_variedad'],
                color_fruto=row.get('color_fruto', ''),
                sabor=row.get('sabor', ''),
                tamanio_planta=row.get('tamano_planta', ''),
                profundidad_siembra_cm=prof_siembra,
                distancia_plantas_cm=dist_plantas,
                distancia_surcos_cm=dist_surcos,
                frecuencia_riego=frecuencia_riego,
                exposicion_solar=exposicion_solar,
                dias_germinacion_min=dias_germ_min,
                dias_germinacion_max=dias_germ_max,
                dias_hasta_cosecha_min=dias_cosecha_min,
                dias_hasta_cosecha_max=dias_cosecha_max,
                temperatura_minima_c=temp_min,
                temperatura_maxima_c=temp_max,
                es_hija_f1=row.get('es_hibrido', 'false').lower() == 'true',
                es_variedad_antigua=row.get('es_variedad_antigua', 'false').lower() == 'true',
                generacion=row.get('generacion', 'Original')
            )
            session.add(variedad)
            variedades_data[variedad.id] = variedad
    
    session.commit()
    print(f"✅ {len(variedades_data)} variedades importadas")
    return variedades_data


def import_lotes_semillas(session, csv_path, usuario_id):
    """Import lotes_semillas from CSV"""
    print(f"\n📥 Importando lotes de semillas desde {csv_path}...")
    
    lotes_count = 0
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse numeric values
            try:
                cantidad_estimada = int(row['cantidad_estimada'])
            except (ValueError, KeyError):
                cantidad_estimada = None
            
            try:
                ano_produccion = int(row['ano_produccion'])
            except (ValueError, KeyError):
                ano_produccion = None
            
            try:
                anos_viabilidad = int(row['anos_viabilidad_semilla'])
            except (ValueError, KeyError):
                anos_viabilidad = None
            
            try:
                temperatura = float(row['temperatura_almacenamiento_c'])
            except (ValueError, KeyError):
                temperatura = None
            
            try:
                humedad = float(row['humedad_relativa'])
            except (ValueError, KeyError):
                humedad = None
            
            try:
                cantidad_restante = int(row['cantidad_restante'])
            except (ValueError, KeyError):
                cantidad_restante = cantidad_estimada
            
            # Parse date
            fecha_adquisicion = None
            if row.get('fecha_adquisicion'):
                try:
                    fecha_adquisicion = datetime.strptime(row['fecha_adquisicion'], '%Y-%m-%d').date()
                except:
                    fecha_adquisicion = None
            
            lote = LoteSemillas(
                usuario_id=usuario_id,
                variedad_id=int(row['variedad_id']),
                nombre_comercial=row.get('nombre_comercial', ''),
                marca=row.get('marca', ''),
                numero_lote=row.get('nombre_lote', ''),
                cantidad_estimada=cantidad_estimada,
                anno_produccion=ano_produccion,
                fecha_adquisicion=fecha_adquisicion,
                anos_viabilidad_semilla=anos_viabilidad,
                lugar_almacenamiento=row.get('lugar_almacenamiento', ''),
                temperatura_almacenamiento_c=temperatura,
                humedad_relativa=humedad,
                estado=EstadoLoteSemillas.ACTIVO if row.get('estado', 'Disponible') == 'Disponible' else row.get('estado'),
                cantidad_restante=cantidad_restante,
                origen=row.get('origen', ''),
                tipo_origen=row.get('tipo_origen', ''),
                generacion=row.get('generacion', 'Original')
            )
            session.add(lote)
            lotes_count += 1
    
    session.commit()
    print(f"✅ {lotes_count} lotes de semillas importados")
    return lotes_count


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def main():
    """Main function"""
    print("=" * 60)
    print("🌱 IMPORTADOR DE DATOS DE SEMILLAS - Lorapp")
    print("=" * 60)
    
    # Get usuario name from command line or use default
    usuario_nombre = sys.argv[1] if len(sys.argv) > 1 else "Urtzi"
    
    # Get database session
    session = get_db_session()
    
    try:
        # Find or create user
        usuario = find_or_create_user(session, usuario_nombre)
        if not usuario:
            sys.exit(1)
        
        # Get CSV paths
        backend_dir = Path(__file__).parent
        especies_csv = backend_dir / "especies.csv"
        variedades_csv = backend_dir / "variedades.csv"
        lotes_csv = backend_dir / "lotes_semillas.csv"
        
        # Check if CSV files exist
        for csv_file in [especies_csv, variedades_csv, lotes_csv]:
            if not csv_file.exists():
                print(f"❌ Archivo no encontrado: {csv_file}")
                sys.exit(1)
        
        # Clean database
        clean_database(session)
        
        # Import data
        import_especies(session, especies_csv)
        import_variedades(session, variedades_csv)
        import_lotes_semillas(session, lotes_csv, usuario.id)
        
        print("\n" + "=" * 60)
        print("✅ ¡Importación completada exitosamente!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error durante la importación: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
