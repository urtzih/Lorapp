"""
SQLAlchemy database models for Lorapp including an advanced seed bank system.
Defines tables for users, species, varieties, seed lots, plantings, harvests, and more.
"""
# pylint: disable=unused-import
# pyright: ignore

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum, text
from sqlalchemy.orm import relationship
from app.infrastructure.database.base import Base
import enum


# ============================================================================
# ENUMS
# ============================================================================

class EstadoLoteSemillas(str, enum.Enum):
    """Estados posibles de un lote de semillas"""
    ACTIVO = "activo"
    AGOTADO = "agotado"
    VENCIDO = "vencido"
    DESCARTADO = "descartado"


class TipoExposicionSolar(str, enum.Enum):
    """Tipos de exposición solar"""
    TOTAL = "total"
    PARCIAL = "parcial"
    SOMBRA = "sombra"


class FrecuenciaRiego(str, enum.Enum):
    """Frecuencias de riego comunes"""
    DIARIO = "diario"
    CADA_DOS_DIAS = "cada_dos_dias"
    SEMANAL = "semanal"
    CADA_DOS_SEMANAS = "cada_dos_semanas"
    MENSUAL = "mensual"


class EstadoPlantacion(str, enum.Enum):
    """Estados de una plantación"""
    PLANIFICADA = "planificada"
    SEMBRADA = "sembrada"
    GERMINADA = "germinada"
    TRASPLANTADA = "trasplantada"
    CRECIMIENTO = "crecimiento"
    COSECHA_CERCANA = "cosecha_cercana"
    COSECHADA = "cosechada"
    CANCELADA = "cancelada"


class TipoCosecha(str, enum.Enum):
    """Tipos de cosecha"""
    CONSUMO = "consumo"
    SEMILLA = "semilla"
    MIXTA = "mixta"


# ============================================================================
# USER MODEL (sin cambios)
# ============================================================================

class User(Base):
    """
    User account model.
    Stores authentication credentials, profile information, and preferences.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    name = Column(String(255), nullable=False)
    
    # Location data for agricultural calendar
    location = Column(String(500), nullable=True)  # Address or place name
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    climate_zone = Column(String(50), nullable=True)  # e.g., "temperate", "mediterranean"
    
    # User preferences
    language = Column(String(5), default="es")  # "es" or "eu"
    notifications_enabled = Column(Boolean, default=True)
    
    # OAuth data
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    oauth_provider = Column(String(50), nullable=True)  # "google", etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    lotes_semillas = relationship("LoteSemillas", back_populates="usuario", cascade="all, delete-orphan")
    plantaciones = relationship("Plantacion", back_populates="usuario", cascade="all, delete-orphan")
    cosechas = relationship("Cosecha", back_populates="usuario", cascade="all, delete-orphan")
    cosechas_semillas = relationship("CosechaSemillas", back_populates="usuario", cascade="all, delete-orphan")
    pruebas_germinacion = relationship("PruebaGerminacion", back_populates="usuario", cascade="all, delete-orphan")
    push_subscriptions = relationship("PushSubscription", back_populates="usuario", cascade="all, delete-orphan")


# ============================================================================
# BANCO DE SEMILLAS - TABLAS PRINCIPALES
# ============================================================================

class Especie(Base):
    """
    Especie botánica model.
    Almacena información de especies biológicas disponibles.
    """
    __tablename__ = "especies"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre_comun = Column(String(255), nullable=False, index=True)
    nombre_cientifico = Column(String(255), nullable=True, unique=True)
    familia_botanica = Column(String(100), nullable=True)  # Solanaceae, Brassicaceae, etc.
    genero = Column(String(100), nullable=True)  # Solanum, Lactuca, etc.
    
    # Descripción y clasificación
    descripcion = Column(Text, nullable=True)
    tipo_cultivo = Column(String(50), nullable=True)  # "hortaliza", "fruta", "flor", "aromática"
    
    # Parámetros agrícolas estándar
    profundidad_siembra_cm = Column(Float, nullable=True)
    distancia_plantas_cm = Column(Float, nullable=True)
    distancia_surcos_cm = Column(Float, nullable=True)
    frecuencia_riego = Column(SQLEnum(FrecuenciaRiego), nullable=True)
    exposicion_solar = Column(SQLEnum(TipoExposicionSolar), nullable=True)
    
    # Ciclo de cultivo
    dias_germinacion_min = Column(Integer, nullable=True)
    dias_germinacion_max = Column(Integer, nullable=True)
    dias_hasta_trasplante = Column(Integer, nullable=True)
    dias_hasta_cosecha_min = Column(Integer, nullable=True)
    dias_hasta_cosecha_max = Column(Integer, nullable=True)
    
    # Calendario de siembra
    meses_siembra_interior = Column(JSON, default=list)  # [1, 2, 3]
    meses_siembra_exterior = Column(JSON, default=list)  # [4, 5, 6]
    
    # Condiciones de crecimiento
    temperatura_minima_c = Column(Float, nullable=True)
    temperatura_maxima_c = Column(Float, nullable=True)
    zonas_climaticas_preferidas = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    variedades = relationship("Variedad", back_populates="especie", cascade="all, delete-orphan")


class Variedad(Base):
    """
    Variedad de especie model.
    Almacena variedades específicas dentro de una especie.
    """
    __tablename__ = "variedades"
    
    id = Column(Integer, primary_key=True, index=True)
    especie_id = Column(Integer, ForeignKey("especies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Identificación
    nombre_variedad = Column(String(255), nullable=False, index=True)
    codigo_interno = Column(String(100), nullable=True, unique=True)  # Para inventario interno
    
    # Características específicas
    descripcion = Column(Text, nullable=True)
    color_fruto = Column(String(100), nullable=True)
    sabor = Column(String(255), nullable=True)
    tamanio_planta = Column(String(50), nullable=True)  # "enana", "compacta", "grande", "trepadoras"
    
    # Parámetros heredados de especie (pueden ser sobrescritos)
    profundidad_siembra_cm = Column(Float, nullable=True)
    distancia_plantas_cm = Column(Float, nullable=True)
    distancia_surcos_cm = Column(Float, nullable=True)
    dias_germinacion_min = Column(Integer, nullable=True)
    dias_germinacion_max = Column(Integer, nullable=True)
    dias_hasta_cosecha_min = Column(Integer, nullable=True)
    dias_hasta_cosecha_max = Column(Integer, nullable=True)
    
    # Resistencias y características especiales
    resistencias = Column(JSON, default=list)  # ["plagas", "enfermedades"]
    es_hija_f1 = Column(Boolean, default=False)  # Híbrido F1
    es_variedad_antigua = Column(Boolean, default=False)  # Heirloom/landrace
    
    # Origen y trazabilidad
    tipo_origen = Column(String(50), nullable=True)  # "compra", "propia", "intercambio", "herencia"
    procedencia = Column(String(255), nullable=True)  # Proveedor o lugar de origen
    anno_recoleccion = Column(Integer, nullable=True)  # Año en que se recolectó o compró
    generacion = Column(String(50), nullable=True)  # "F1", "F2", "F3", "OP" (open pollinated), etc
    tipo_polinizacion = Column(String(100), nullable=True)  # "abierta", "autopolinizante", "polinización cruzada"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    especie = relationship("Especie", back_populates="variedades")
    lotes_semillas = relationship("LoteSemillas", back_populates="variedad", cascade="all, delete-orphan")


class LoteSemillas(Base):
    """
    Lote de semillas model.
    Representa un paquete o lote físico de semillas del usuario.
    """
    __tablename__ = "lotes_semillas"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variedad_id = Column(Integer, ForeignKey("variedades.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información comercial
    nombre_comercial = Column(String(500), nullable=False)  # Nombre del paquete
    marca = Column(String(255), nullable=True)
    numero_lote = Column(String(100), nullable=True, index=True)
    
    # Datos del paquete
    cantidad_estimada = Column(Integer, nullable=True)  # Número de semillas
    anno_produccion = Column(Integer, nullable=True)
    fecha_vencimiento = Column(DateTime, nullable=True)
    fecha_adquisicion = Column(DateTime, nullable=True)
    
    # Información de almacenamiento
    lugar_almacenamiento = Column(String(255), nullable=True)  # "frigo", "despensa", etc.
    temperatura_almacenamiento_c = Column(Float, nullable=True)
    humedad_relativa = Column(Float, nullable=True)  # Porcentaje 0-100
    
    # Estado y seguimiento
    estado = Column(SQLEnum(EstadoLoteSemillas), default=EstadoLoteSemillas.ACTIVO)
    cantidad_restante = Column(Integer, nullable=True)
    
    # Documentación
    fotos = Column(JSON, default=list)  # Rutas de imágenes
    notas = Column(Text, nullable=True)
    informacion_proveedor = Column(JSON, nullable=True)  # {"url": "...", "contacto": "..."}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="lotes_semillas")
    variedad = relationship("Variedad", back_populates="lotes_semillas")
    plantaciones = relationship("Plantacion", back_populates="lote_semillas", cascade="all, delete-orphan")
    pruebas_germinacion = relationship("PruebaGerminacion", back_populates="lote_semillas", cascade="all, delete-orphan")


# ============================================================================
# BANCO DE SEMILLAS - PRUEBAS Y CONTROL DE CALIDAD
# ============================================================================

class PruebaGerminacion(Base):
    """
    Prueba de germinación model.
    Registra pruebas de viabilidad de semillas.
    """
    __tablename__ = "pruebas_germinacion"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lote_semillas_id = Column(Integer, ForeignKey("lotes_semillas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Datos de la prueba
    fecha_prueba = Column(DateTime, nullable=False)
    cantidad_semillas_probadas = Column(Integer, nullable=False)
    cantidad_germinadas = Column(Integer, nullable=False)
    
    # Resultados
    porcentaje_germinacion = Column(Float, nullable=True)  # Calculado
    dias_germinacion_promedio = Column(Float, nullable=True)
    
    # Condiciones de prueba
    temperatura_prueba_c = Column(Float, nullable=True)
    humedad_prueba_relativa = Column(Float, nullable=True)
    medio_germinacion = Column(String(100), nullable=True)  # "algodón", "papel", "tierra", "agua"
    
    # Notas
    observaciones = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="pruebas_germinacion")
    lote_semillas = relationship("LoteSemillas", back_populates="pruebas_germinacion")


# ============================================================================
# BANCO DE SEMILLAS - GESTIÓN DE CULTIVOS
# ============================================================================

class Temporada(Base):
    """
    Temporada de cultivo model.
    Define períodos de cultivo (ej: "Primavera 2026", "Verano 2026").
    """
    __tablename__ = "temporadas"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre = Column(String(100), nullable=False)
    anno = Column(Integer, nullable=False)
    
    # Período
    mes_inicio = Column(Integer, nullable=False)  # 1-12
    mes_fin = Column(Integer, nullable=False)  # 1-12
    
    # Información
    descripcion = Column(Text, nullable=True)
    clima_esperado = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore


class Plantacion(Base):
    """
    Plantación model.
    Registra eventos de siembra/plantación de semillas.
    """
    __tablename__ = "plantaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lote_semillas_id = Column(Integer, ForeignKey("lotes_semillas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información de plantación
    nombre_plantacion = Column(String(255), nullable=False)  # Ej: "Tomates huerto sur"
    fecha_siembra = Column(DateTime, nullable=False)
    tipo_siembra = Column(String(50), nullable=False)  # "interior", "exterior", "terraza"
    cantidad_semillas_plantadas = Column(Integer, nullable=True)
    
    # Ubicación física
    ubicacion_descripcion = Column(String(255), nullable=True)  # "huerto norte", "maceta terraza"
    coordenadas_x = Column(Float, nullable=True)  # Para mapas futuros
    coordenadas_y = Column(Float, nullable=True)
    
    # Seguimiento del ciclo
    estado = Column(SQLEnum(EstadoPlantacion), default=EstadoPlantacion.PLANIFICADA)
    fecha_germinacion = Column(DateTime, nullable=True)
    fecha_trasplante = Column(DateTime, nullable=True)
    fecha_cosecha_estimada = Column(DateTime, nullable=True)
    
    # Observaciones y fotos
    fotos = Column(JSON, default=list)
    notas = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="plantaciones")
    lote_semillas = relationship("LoteSemillas", back_populates="plantaciones")
    cosechas = relationship("Cosecha", back_populates="plantacion", cascade="all, delete-orphan")
    cosechas_semillas = relationship("CosechaSemillas", back_populates="plantacion", cascade="all, delete-orphan")


class Cosecha(Base):
    """
    Cosecha model.
    Registra cosechas de alimentos/frutos de una plantación.
    """
    __tablename__ = "cosechas"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plantacion_id = Column(Integer, ForeignKey("plantaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información de cosecha
    fecha_cosecha = Column(DateTime, nullable=False)
    cantidad_kg = Column(Float, nullable=True)  # Peso cosechado
    cantidad_unidades = Column(Integer, nullable=True)  # Número de frutos/plantas
    
    # Descripción
    descripcion = Column(Text, nullable=True)
    calidad_observada = Column(String(100), nullable=True)  # "excelente", "buena", "regular", "mala"
    
    # Almacenamiento y uso
    metodo_almacenamiento = Column(String(100), nullable=True)  # "frigo", "despensa", "congelador"
    fecha_consumo_inicio = Column(DateTime, nullable=True)
    
    # Fotos
    fotos = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="cosechas")
    plantacion = relationship("Plantacion", back_populates="cosechas")


class CosechaSemillas(Base):
    """
    Cosecha de semillas model.
    Registra cuando se cosechan semillas de una plantación para propagación.
    """
    __tablename__ = "cosechas_semillas"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plantacion_id = Column(Integer, ForeignKey("plantaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información de cosecha
    fecha_cosecha = Column(DateTime, nullable=False)
    cantidad_semillas_estimada = Column(Integer, nullable=True)
    
    # Descripción del proceso
    descripcion = Column(Text, nullable=True)
    metodo_secado = Column(String(100), nullable=True)  # "aire", "deshidratador", "congelador"
    fecha_secado_completado = Column(DateTime, nullable=True)
    
    # Viabilidad inicial
    porcentaje_viabilidad_inicial = Column(Float, nullable=True)
    
    # Alumacenamiento
    lugar_almacenamiento = Column(String(255), nullable=True)
    temperatura_almacenamiento_c = Column(Float, nullable=True)
    humedad_relativa = Column(Float, nullable=True)
    
    # Fotos
    fotos = Column(JSON, default=list)
    notas = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="cosechas_semillas")
    plantacion = relationship("Plantacion", back_populates="cosechas_semillas")


class PushSubscription(Base):
    """
    Web Push notification subscription model.
    Stores browser push subscription data for each user device.
    """
    __tablename__ = "push_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Web Push subscription data
    endpoint = Column(String(500), unique=True, nullable=False)
    expiration_time = Column(DateTime, nullable=True)
    p256dh = Column(String(500), nullable=False)  # Encryption key
    auth = Column(String(500), nullable=False)  # Authentication secret
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    user_agent = Column(String(500), nullable=True)  # Browser/device info
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    usuario = relationship("User", back_populates="push_subscriptions")


class CropRule(Base):
    """
    Agricultural rules model.
    Stores planting guidelines for different crop families and climate zones.
    """
    __tablename__ = "crop_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Crop identification
    crop_family = Column(String(100), unique=True, nullable=False, index=True)
    common_names = Column(JSON, default=list)  # List of common names in different languages
    
    # Planting windows (month numbers)
    indoor_planting_months = Column(JSON, default=list)  # [1, 2, 3] for Jan, Feb, Mar
    outdoor_planting_months = Column(JSON, default=list)  # [4, 5, 6] for Apr, May, Jun
    
    # Growth timeline
    germination_days_min = Column(Integer, nullable=True)
    germination_days_max = Column(Integer, nullable=True)
    days_to_transplant = Column(Integer, nullable=True)
    days_to_harvest_min = Column(Integer, nullable=True)
    days_to_harvest_max = Column(Integer, nullable=True)
    
    # Growing conditions
    min_temperature_c = Column(Float, nullable=True)
    max_temperature_c = Column(Float, nullable=True)
    preferred_climate_zones = Column(JSON, default=list)  # ["temperate", "mediterranean"]
    
    # Agricultural parameters
    planting_depth_cm = Column(Float, nullable=True)
    spacing_cm = Column(Float, nullable=True)
    row_spacing_cm = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))  # type: ignore


class NotificationHistory(Base):
    """
    Notification history model.
    Tracks all notifications sent to users for debugging and analytics.
    """
    __tablename__ = "notification_history"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification details
    notification_type = Column(String(100), nullable=False)  # "monthly_planting", "expiration", "transplant"
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSON, default=dict)  # Additional payload data
    
    # Delivery status
    sent_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
