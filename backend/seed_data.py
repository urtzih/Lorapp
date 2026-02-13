"""
Seed data script for Lorapp database.
Inserts initial species, varieties, and user seed inventory.

Usage:
    python seed_data.py
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.base import Base
from app.infrastructure.database.models import Especie, Variedad, LoteSemillas, User
from app.core.config import settings
from app.core.security import get_password_hash
from datetime import datetime

# Database connection
engine = create_engine(
    f"postgresql://{settings.DATABASE_URL.split('://')[1]}",
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# User credentials
USER_EMAIL = "urtzid@gmail.com"
USER_PASSWORD = "admin123"
USER_NAME = "Urtzi"

# Seed data structure
SPECIES_AND_VARIETIES = {
    "Tomate": [
        {"nombre": "Orange Truffle", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Rebel Starfighter Prime", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Rebel Starfighter Kaleigh Anne", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Tanageto Rojo Robinson", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Panamorous", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Schokoladniy Marmalade", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Rosa Aretxabaleta", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cassady's Folly", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Amarillo", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Blush", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Gold Berry", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Negro", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Rojo", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Cherry Rosa", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Green Zebra", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Kryptonite", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Tomacó de Lavi Cisco", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Tomata", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Tomata Asier", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "País", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Chile": [
        {"nombre": "Scotch Bonnet", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Dátil", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Fish Pepper", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Hang Jiao 10", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Pimiento": [
        {"nombre": "Banana Dulce", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Pepperoni Friarielli", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Carolina Reaper", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Padrón", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Piparra", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Berenjena": [
        {"nombre": "Figuig", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Bangladeshi Long", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Dishgothi", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Vilmorin", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Pepino": [
        {"nombre": "Hmong Red", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Medio Largo Ashley", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Melón": [
        {"nombre": "Sweet Passion", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Almorta": [
        {"nombre": "Castellana", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Mostaza": [
        {"nombre": "Vibrant Ultraviolet", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
        {"nombre": "Blanca", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Rábano": [
        {"nombre": "Daikon Mino Early", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Capuchina": [
        {"nombre": "Purple Emperor", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Amapola": [
        {"nombre": "Panadera", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Durillo": [
        {"nombre": "Blanco francés", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Hinojo": [
        {"nombre": "Smokey", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Clavel del poeta": [
        {"nombre": None, "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Vinagreira": [
        {"nombre": "Roja", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Chumbera": [
        {"nombre": "Roja", "tipo_origen": "compra", "procedencia": "Latanina", "anno": 2025, "generacion": None, "polinizacion": "abierta"},
    ],
    "Calabacín": [
        {"nombre": "Black Beauty", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Amarillo", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Blanco", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
        {"nombre": "Redondo", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Calabaza": [
        {"nombre": "Vasca", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Zanahoria": [
        {"nombre": None, "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Rúcula": [
        {"nombre": None, "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Pak-Choi": [
        {"nombre": None, "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Romanesco": [
        {"nombre": None, "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Cilantro": [
        {"nombre": None, "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Perejil": [
        {"nombre": "Común", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Cebollino": [
        {"nombre": "Anual", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Manzanilla": [
        {"nombre": "Camomila", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
    "Maíz": [
        {"nombre": "Golden Bantan", "tipo_origen": "propia", "procedencia": "Josele", "anno": 2025, "generacion": "F2", "polinizacion": "abierta"},
    ],
}

# Familia botanica por especie (basado en clasificacion botanica estandar)
SPECIES_FAMILIES = {
    "Tomate": "Solanaceae",
    "Chile": "Solanaceae",
    "Pimiento": "Solanaceae",
    "Berenjena": "Solanaceae",
    "Pepino": "Cucurbitaceae",
    "Melón": "Cucurbitaceae",
    "Calabacín": "Cucurbitaceae",
    "Calabaza": "Cucurbitaceae",
    "Mostaza": "Brassicaceae",
    "Rábano": "Brassicaceae",
    "Rúcula": "Brassicaceae",
    "Pak-Choi": "Brassicaceae",
    "Romanesco": "Brassicaceae",
    "Zanahoria": "Apiaceae",
    "Cilantro": "Apiaceae",
    "Perejil": "Apiaceae",
    "Hinojo": "Apiaceae",
    "Cebollino": "Amaryllidaceae",
    "Manzanilla": "Asteraceae",
    "Maíz": "Poaceae",
    "Almorta": "Fabaceae",
    "Capuchina": "Tropaeolaceae",
    "Amapola": "Papaveraceae",
    "Durillo": "Adoxaceae",
    "Clavel del poeta": "Caryophyllaceae",
    "Vinagreira": "Malvaceae",
    "Chumbera": "Cactaceae",
}


def seed_database():
    """Insert seed data into the database."""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        user = db.query(User).filter(User.email == USER_EMAIL).first()
        
        if not user:
            # Create user
            user = User(
                email=USER_EMAIL,
                hashed_password=get_password_hash(USER_PASSWORD),
                name=USER_NAME,
                language="es",
                notifications_enabled=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Usuario creado: {USER_EMAIL}")
        else:
            print(f"ℹ️  Usuario ya existe: {USER_EMAIL}")
        
        # Check if data already exists
        existing_count = db.query(Especie).count()
        if existing_count > 0:
            print(f"⚠️  Base de datos ya contiene {existing_count} especies. Actualizando familias botánicas...")
            for species_name, family in SPECIES_FAMILIES.items():
                db.execute(
                    text("UPDATE especies SET familia_botanica = :family WHERE nombre_comun = :name"),
                    {"family": family, "name": species_name}
                )
            db.commit()
            print("✅ Familias botánicas actualizadas.")
            return
        
        print("🌱 Iniciando inserción de datos de semillas...")
        
        total_varieties = 0
        total_lotes = 0
        
        for species_name, varieties in SPECIES_AND_VARIETIES.items():
            # Create species
            especie = Especie(
                nombre_comun=species_name,
                familia_botanica=SPECIES_FAMILIES.get(species_name),
                tipo_cultivo="hortaliza" if species_name in ["Tomate", "Chile", "Pimiento", "Berenjena", "Pepino", 
                                                              "Melón", "Mostaza", "Rábano", "Zanahoria", "Rúcula",
                                                              "Pak-Choi", "Romanesco", "Cilantro", "Perejil", "Cebollino",
                                                              "Calabacín", "Calabaza", "Almorta", "Maíz"] else "flor"
            )
            db.add(especie)
            db.flush()  # Flush to get the ID
            
            # Add varieties and lotes for this species
            for var in varieties:
                # Create variety
                variedad = Variedad(
                    especie_id=especie.id,
                    nombre_variedad=var["nombre"] if var["nombre"] else f"{species_name} (tipo base)",
                    tipo_origen=var["tipo_origen"],
                    procedencia=var["procedencia"],
                    anno_recoleccion=var["anno"],
                    generacion=var["generacion"],
                    tipo_polinizacion=var["polinizacion"]
                )
                db.add(variedad)
                db.flush()  # Flush to get variedad ID
                total_varieties += 1
                
                # Create lote for user's inventory
                lote = LoteSemillas(
                    usuario_id=user.id,
                    variedad_id=variedad.id,
                    nombre_comercial=f"{species_name} - {variedad.nombre_variedad}",
                    anno_produccion=var["anno"],
                    fecha_adquisicion=datetime(2025, 1, 1),
                    estado="activo",
                    cantidad_estimada=50,  # Default quantity
                    cantidad_restante=50,
                    lugar_almacenamiento="Almacén principal",
                    notas=f"Origen: {var['procedencia']} | Generación: {var['generacion'] or 'Original'}"
                )
                db.add(lote)
                total_lotes += 1
            
            print(f"  ✅ {species_name}: {len(varieties)} variedades + lotes")
        
        db.commit()
        print(f"\n🎉 Inserción completada exitosamente!")
        print(f"   👤 Usuario: {USER_EMAIL}")
        print(f"   📊 {len(SPECIES_AND_VARIETIES)} especies")
        print(f"   📊 {total_varieties} variedades")
        print(f"   📦 {total_lotes} lotes de semillas asignados al usuario")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante la inserción: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
