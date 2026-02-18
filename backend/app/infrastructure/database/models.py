"""
SQLAlchemy database models for Lorapp including an advanced seed bank system.
Defines tables for users, species, varieties, seed lots, plantings, harvests, and more.
"""
# pylint: disable=unused-import
# pyright: ignore

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, JSON, ForeignKey, Enum as SQLEnum, text, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.infrastructure.database.base import Base
import enum
from typing import Dict, Any


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
    """Estados de una plantación - Using Spanish values that match database"""
    PLANIFICADA = "PLANIFICADA"
    SEMBRADA = "SEMBRADA"
    GERMINADA = "GERMINADA"
    LISTA = "LISTA"
    TRASPLANTADA = "TRASPLANTADA"
    CRECIMIENTO = "CRECIMIENTO"
    COSECHA_CERCANA = "COSECHA_CERCANA"
    COSECHADA = "COSECHADA"
    CANCELADA = "CANCELADA"


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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    lotes_semillas = relationship("LoteSemillas", back_populates="usuario", cascade="all, delete-orphan")
    plantaciones = relationship("Plantacion", back_populates="usuario", cascade="all, delete-orphan")
    cosechas = relationship("Cosecha", back_populates="usuario", cascade="all, delete-orphan")
    cosechas_semillas = relationship("CosechaSemillas", back_populates="usuario", cascade="all, delete-orphan")
    pruebas_germinacion = relationship("PruebaGerminacion", back_populates="usuario", cascade="all, delete-orphan")
    push_subscriptions = relationship("PushSubscription", back_populates="usuario", cascade="all, delete-orphan")
    temporadas = relationship("Temporada", back_populates="usuario", cascade="all, delete-orphan")
    lugares = relationship("Lugar", back_populates="usuario", cascade="all, delete-orphan")
    archivos = relationship("Archivo", back_populates="usuario", cascade="all, delete-orphan")
    listas = relationship("Lista", back_populates="usuario", cascade="all, delete-orphan")
    fichas_conocimiento = relationship("FichaConocimiento", back_populates="creado_por_usuario", cascade="all, delete-orphan")


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
    
    # ===== LAS SIGUIENTES COLUMNAS ESTÁN COMENTADAS PORQUE NO EXISTEN EN LA BD ACTUAL =====
    # TODO: Ejecutar migraciones de Alembic para añadir estas columnas
    # profundidad_siembra_cm = Column(Float, nullable=True)
    # distancia_plantas_cm = Column(Float, nullable=True)
    # distancia_surcos_cm = Column(Float, nullable=True)
    # frecuencia_riego = Column(SQLEnum(FrecuenciaRiego), nullable=True)
    # exposicion_solar = Column(SQLEnum(TipoExposicionSolar), nullable=True)
    # dias_germinacion_min = Column(Integer, nullable=True)
    # dias_germinacion_max = Column(Integer, nullable=True)
    # dias_hasta_trasplante = Column(Integer, nullable=True)
    # dias_hasta_cosecha_min = Column(Integer, nullable=True)
    # dias_hasta_cosecha_max = Column(Integer, nullable=True)
    # meses_siembra_interior = Column(JSON, default=list)
    # meses_siembra_exterior = Column(JSON, default=list)
    # temperatura_minima_c = Column(Float, nullable=True)
    # temperatura_maxima_c = Column(Float, nullable=True)
    # zonas_climaticas_preferidas = Column(JSON, default=list)
    # ===================================================================================
    
    # Square Foot Gardening (campos antiguos - mantener por compatibilidad)
    square_foot_plants = Column(Integer, nullable=True)  # Número de plantas por cuadrado de 30x30cm
    square_foot_spacing = Column(Float, nullable=True)  # Espaciado entre plantas en cm
    square_foot_notes = Column(Text, nullable=True)  # Notas especiales para SFG
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    variedades = relationship("Variedad", back_populates="especie", cascade="all, delete-orphan")
    square_foot_gardening = relationship("SquareFootGardening", back_populates="especie", uselist=False, cascade="all, delete-orphan")


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
    
    # Parámetros de cultivo específicos de la variedad
    profundidad_siembra_cm = Column(Float, nullable=True)
    distancia_plantas_cm = Column(Float, nullable=True)
    distancia_surcos_cm = Column(Float, nullable=True)
    frecuencia_riego = Column(SQLEnum(FrecuenciaRiego), nullable=True)
    exposicion_solar = Column(SQLEnum(TipoExposicionSolar), nullable=True)
    dias_germinacion_min = Column(Integer, nullable=True)
    dias_germinacion_max = Column(Integer, nullable=True)
    dias_hasta_trasplante = Column(Integer, nullable=True)
    dias_hasta_cosecha_min = Column(Integer, nullable=True)
    dias_hasta_cosecha_max = Column(Integer, nullable=True)
    
    # Calendario de siembra específico
    meses_siembra_interior = Column(JSON, default=list)  # [1, 2, 3]
    meses_siembra_exterior = Column(JSON, default=list)  # [4, 5, 6]
    
    # Condiciones de crecimiento específicas
    temperatura_minima_c = Column(Float, nullable=True)
    temperatura_maxima_c = Column(Float, nullable=True)
    zonas_climaticas_preferidas = Column(JSON, default=list)
    
    # Resistencias y características especiales
    resistencias = Column(JSON, default=list)  # ["plagas", "enfermedades"]
    es_hija_f1 = Column(Boolean, default=False)  # Híbrido F1
    es_variedad_antigua = Column(Boolean, default=False)  # Heirloom/landrace
    
    # Origen y trazabilidad
    procedencia = Column(String(255), nullable=True)  # Proveedor o lugar de origen
    generacion = Column(String(50), nullable=True)  # "F1", "F2", "F3", "OP" (open pollinated), etc
    tipo_polinizacion = Column(String(100), nullable=True)  # "abierta", "autopolinizante", "polinización cruzada"
    
    # Documentación con fotos
    fotos = Column(JSON, default=list)  # Fotos de la variedad (planta, fruto, semillas)
    
    # Square Foot Gardening (sobrescribe valores de especie si están definidos)
    square_foot_plants = Column(Integer, nullable=True)  # Número de plantas por cuadrado de 30x30cm
    square_foot_spacing = Column(Float, nullable=True)  # Espaciado entre plantas en cm
    square_foot_notes = Column(Text, nullable=True)  # Notas especiales para SFG
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    especie = relationship("Especie", back_populates="variedades")
    lotes_semillas = relationship("LoteSemillas", back_populates="variedad", cascade="all, delete-orphan")


class SquareFootGardening(Base):
    """
    Square Foot Gardening model.
    Almacena los datos de plantación intensiva en cuadrados de 30x30cm.
    Incluye los 3 métodos: Original, Multisiembra (Multisow) y Macizo.
    """
    __tablename__ = "square_foot_gardening"
    
    id = Column(Integer, primary_key=True, index=True)
    especie_id = Column(Integer, ForeignKey("especies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Métodos de plantación (plantas por cuadrado de 30x30cm)
    plantas_original = Column(Integer, nullable=True, comment="Plantas por cuadrado - Método original SFG")
    plantas_multisow = Column(Integer, nullable=True, comment="Plantas por cuadrado - Siembra múltiple")
    plantas_macizo = Column(Integer, nullable=True, comment="Plantas por cuadrado - Siembra en macizo")
    
    # Información adicional
    espaciado_cm = Column(Float, nullable=True, comment="Espaciado entre plantas en cm")
    notas = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    especie = relationship("Especie", back_populates="square_foot_gardening", uselist=False)


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
    fecha_adquisicion = Column(DateTime, nullable=True)
    anos_viabilidad_semilla = Column(Integer, nullable=True)  # Años que la semilla mantiene viabilidad
    
    # Información de almacenamiento
    lugar_almacenamiento = Column(String(255), nullable=True)  # "frigo", "despensa", etc.
    temperatura_almacenamiento_c = Column(Float, nullable=True)
    humedad_relativa = Column(Float, nullable=True)  # Porcentaje 0-100
    
    # Estado y seguimiento
    estado = Column(SQLEnum(EstadoLoteSemillas), default=EstadoLoteSemillas.ACTIVO)
    cantidad_restante = Column(Integer, nullable=True)
    
    # Trazabilidad de origen y generación
    origen = Column(String(255), nullable=True, index=True)  # "Latanina", "Huerta Urtzi", etc.
    tipo_origen = Column(String(50), nullable=True)  # "compra", "propia", "intercambio", "herencia"
    anno_recoleccion = Column(Integer, nullable=True)  # Año en que se recolectó o compró
    generacion = Column(String(100), nullable=True, index=True)  # "Original", "F2", "F3", etc.
    
    # Documentación
    notas = Column(Text, nullable=True)
    informacion_proveedor = Column(JSON, nullable=True)  # {"url": "...", "contacto": "..."}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Propiedades calculadas
    @property
    def fecha_vencimiento(self):
        """Calcula la fecha de vencimiento basado en fecha_adquisicion y anos_viabilidad_semilla"""
        if self.fecha_adquisicion and self.anos_viabilidad_semilla:
            from datetime import timedelta
            return self.fecha_adquisicion + timedelta(days=365.25 * self.anos_viabilidad_semilla)
        return None
    
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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="pruebas_germinacion")
    lote_semillas = relationship("LoteSemillas", back_populates="pruebas_germinacion")


# ============================================================================
# BANCO DE SEMILLAS - GESTIÓN DE CULTIVOS
# ============================================================================
from sqlalchemy.dialects.postgresql import JSONB, BIGINT

# ========================================
# NUEVOS MODELOS COLABORATIVOS Y ESCALABLES
# ========================================

class Temporada(Base):
    __tablename__ = "temporadas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    usuario = relationship("User", back_populates="temporadas")
    plantaciones = relationship("Plantacion", back_populates="temporada", cascade="all, delete-orphan")
    __table_args__ = (
        UniqueConstraint('usuario_id', 'nombre', name='uq_temporada_usuario_nombre'),
    )

class Lugar(Base):
    __tablename__ = "lugares"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    tipo = Column(String(100), nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    usuario = relationship("User", back_populates="lugares")
    plantaciones = relationship("Plantacion", back_populates="lugar", cascade="all, delete-orphan")
    __table_args__ = (
        UniqueConstraint('usuario_id', 'nombre', name='uq_lugar_usuario_nombre'),
    )

class Archivo(Base):
    __tablename__ = "archivos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entidad_tipo = Column(String(50), nullable=False)
    entidad_id = Column(Integer, nullable=False)
    tipo_archivo = Column(String(50), nullable=False)
    url = Column(Text, nullable=False)
    nombre_original = Column(Text, nullable=True)
    mime_type = Column(String(100), nullable=True)
    tamano_bytes = Column(BIGINT, nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    usuario = relationship("User", back_populates="archivos")
    __table_args__ = (
        Index('idx_archivos_entidad', 'entidad_tipo', 'entidad_id'),
    )

class Lista(Base):
    __tablename__ = "listas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    visibilidad = Column(String(50), nullable=False)
    slug_publico = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    usuario = relationship("User", back_populates="listas")
    items = relationship("ListaItem", back_populates="lista", cascade="all, delete-orphan")
    __table_args__ = (
        Index('idx_listas_usuario_visibilidad', 'usuario_id', 'visibilidad'),
    )

class ListaItem(Base):
    __tablename__ = "listas_items"
    id = Column(Integer, primary_key=True, index=True)
    lista_id = Column(Integer, ForeignKey("listas.id", ondelete="CASCADE"), nullable=False, index=True)
    lote_id = Column(Integer, ForeignKey("lotes_semillas.id", ondelete="CASCADE"), nullable=True, index=True)
    variedad_id = Column(Integer, ForeignKey("variedades.id"), nullable=True, index=True)
    cantidad_ofrecida = Column(Integer, nullable=True)
    notas = Column(Text, nullable=True)

    lista = relationship("Lista", back_populates="items")
    lote = relationship("LoteSemillas")
    variedad = relationship("Variedad")
    __table_args__ = (
        CheckConstraint('(lote_id IS NOT NULL OR variedad_id IS NOT NULL)', name='chk_lista_item_lote_o_variedad'),
    )

class FichaConocimiento(Base):
    __tablename__ = "fichas_conocimiento"
    id = Column(Integer, primary_key=True, index=True)
    entidad_tipo = Column(String(50), nullable=False)
    entidad_id = Column(Integer, nullable=False)
    tipo_ficha = Column(String(50), nullable=False)
    contenido_md = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    estado = Column(String(50), nullable=False)
    creado_por_usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    creado_por_usuario = relationship("User", back_populates="fichas_conocimiento")
    __table_args__ = (
        Index('idx_fichas_conocimiento', 'entidad_tipo', 'entidad_id', 'tipo_ficha', 'estado'),
    )

class Plantacion(Base):
    """
    Plantación model.
    Registra eventos de siembra/plantación de semillas.
    """
    __tablename__ = "plantaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lote_semillas_id = Column(Integer, ForeignKey("lotes_semillas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Contexto colaborativo
    temporada_id = Column(Integer, ForeignKey("temporadas.id", ondelete="SET NULL"), nullable=True, index=True)
    lugar_id = Column(Integer, ForeignKey("lugares.id", ondelete="SET NULL"), nullable=True, index=True)
    
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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Relationships
    usuario = relationship("User", back_populates="plantaciones")
    lote_semillas = relationship("LoteSemillas", back_populates="plantaciones")
    temporada = relationship("Temporada", back_populates="plantaciones")
    lugar = relationship("Lugar", back_populates="plantaciones")
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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
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
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore


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


class LunarDataCache(Base):
    """
    Cache for lunar phase data from external API.
    Stores moon phases, moonrise/moonset times, and astronomical data by location.
    """
    __tablename__ = "lunar_data_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, unique=True, index=True)
    
    # Location info
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Lunar data
    moon_phase = Column(String(50), nullable=False)
    moon_illumination = Column(Float, nullable=False)
    moonrise = Column(String(10), nullable=True)
    moonset = Column(String(10), nullable=True)
    sunrise = Column(String(10), nullable=True)
    sunset = Column(String(10), nullable=True)
    
    # Raw API response (for debugging/future use)
    raw_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    updated_at = Column(DateTime(timezone=True), onupdate=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Index for quick lookups
    __table_args__ = (
        Index('idx_lunar_cache_date_location', 'date', 'location'),
    )


class WeatherDataCache(Base):
    """
    Cache for weather data from external API.
    Stores temperature, precipitation, wind, and forecasts by location and date.
    """
    __tablename__ = "weather_data_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Location info
    location = Column(String(500), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Temperature data
    temp_max = Column(Float, nullable=True)
    temp_min = Column(Float, nullable=True)
    temp_avg = Column(Float, nullable=True)
    
    # Weather conditions
    condition = Column(String(255), nullable=True)
    humidity = Column(Integer, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    chance_of_rain = Column(Integer, nullable=True)
    wind_kph = Column(Float, nullable=True)
    uv_index = Column(Float, nullable=True)
    
    # Raw API response (for debugging/future use)
    raw_data = Column(JSON, nullable=True)
    
    # Timestamps
    cached_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))  # type: ignore
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('date', 'location', name='uq_weather_date_location'),
        Index('idx_weather_date_location', 'date', 'location'),
    )
    
    def is_fresh(self, hours: int = 24) -> bool:
        """Check if cached data is fresh (less than 'hours' old)."""
        from datetime import datetime, timedelta, timezone
        return datetime.now(timezone.utc) - self.cached_at < timedelta(hours=hours)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert cache entry to dictionary format matching API response."""
        return {
            "date": self.date.isoformat(),
            "location": self.location,
            "coordinates": {
                "latitude": self.latitude,
                "longitude": self.longitude
            },
            "current": {
                "temp_c": self.temp_avg,
                "humidity": self.humidity,
                "wind_kph": self.wind_kph,
                "condition": self.condition,
                "chance_of_rain": self.chance_of_rain
            },
            "daily": {
                "max_temp_c": self.temp_max,
                "min_temp_c": self.temp_min,
                "avg_temp_c": self.temp_avg,
                "condition": self.condition,
                "total_precipitation_mm": self.precipitation_mm,
                "chance_of_rain": self.chance_of_rain,
                "uv_index": self.uv_index
            },
            "forecast_3_days": []
        }
