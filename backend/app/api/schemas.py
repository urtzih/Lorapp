"""
Pydantic schemas for API request/response validation.
Provides data validation, serialization, and documentation for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============ User Schemas ============

class UserBase(BaseModel):
    """Base user fields shared across schemas"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    language: str = Field(default="es", pattern="^(es|eu)$")


class UserCreate(UserBase):
    """Schema for user registration with email/password"""
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Schema for login credentials"""
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication"""
    token: str = Field(..., description="Google ID token from OAuth flow")


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    climate_zone: Optional[str] = None
    language: Optional[str] = Field(None, pattern="^(es|eu)$")
    notifications_enabled: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user data in API responses"""
    id: int
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    climate_zone: Optional[str]
    notifications_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ Especie Schemas ============

class EspecieBase(BaseModel):
    """Base especie fields"""
    nombre_comun: str = Field(..., min_length=1, max_length=255)
    nombre_cientifico: Optional[str] = Field(None, max_length=255)
    familia_botanica: Optional[str] = Field(None, max_length=100)
    genero: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    tipo_cultivo: Optional[str] = Field(None, max_length=50)


class EspecieResponse(EspecieBase):
    """Response schema for Especie (solo información taxonómica básica)"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EspecieUpdate(BaseModel):
    """Schema for updating especie information"""
    nombre_comun: Optional[str] = Field(None, min_length=1, max_length=255)
    nombre_cientifico: Optional[str] = Field(None, max_length=255)
    familia_botanica: Optional[str] = Field(None, max_length=100)
    genero: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    tipo_cultivo: Optional[str] = Field(None, max_length=50)
    profundidad_siembra_cm: Optional[float] = Field(None, ge=0)
    distancia_plantas_cm: Optional[float] = Field(None, ge=0)
    distancia_surcos_cm: Optional[float] = Field(None, ge=0)
    frecuencia_riego: Optional[str] = Field(
        None,
        pattern="^(diario|cada_dos_dias|semanal|cada_dos_semanas|mensual)$"
    )
    exposicion_solar: Optional[str] = Field(None, pattern="^(total|parcial|sombra)$")
    dias_germinacion_min: Optional[int] = Field(None, ge=0)
    dias_germinacion_max: Optional[int] = Field(None, ge=0)
    dias_hasta_trasplante: Optional[int] = Field(None, ge=0)
    dias_hasta_cosecha_min: Optional[int] = Field(None, ge=0)
    dias_hasta_cosecha_max: Optional[int] = Field(None, ge=0)
    meses_siembra_interior: Optional[List[int]] = None
    meses_siembra_exterior: Optional[List[int]] = None
    temperatura_minima_c: Optional[float] = None
    temperatura_maxima_c: Optional[float] = None
    zonas_climaticas_preferidas: Optional[List[str]] = None


# ============ Variedad Schemas ============

class VariedadBase(BaseModel):
    """Base variedad fields"""
    nombre_variedad: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    color_fruto: Optional[str] = Field(None, max_length=100)
    tipo_origen: Optional[str] = Field(None, max_length=50)
    procedencia: Optional[str] = Field(None, max_length=255)
    anno_recoleccion: Optional[int] = Field(None, ge=1900, le=2100)
    generacion: Optional[str] = Field(None, max_length=50)
    tipo_polinizacion: Optional[str] = Field(None, max_length=100)


class VariedadResponse(VariedadBase):
    """Response schema for Variedad (con toda la información de cultivo y fotos)"""
    id: int
    especie_id: int
    codigo_interno: Optional[str]
    sabor: Optional[str]
    tamanio_planta: Optional[str]
    profundidad_siembra_cm: Optional[float]
    distancia_plantas_cm: Optional[float]
    distancia_surcos_cm: Optional[float]
    frecuencia_riego: Optional[str]
    exposicion_solar: Optional[str]
    dias_germinacion_min: Optional[int]
    dias_germinacion_max: Optional[int]
    dias_hasta_trasplante: Optional[int]
    dias_hasta_cosecha_min: Optional[int]
    dias_hasta_cosecha_max: Optional[int]
    meses_siembra_interior: List[int]
    meses_siembra_exterior: List[int]
    temperatura_minima_c: Optional[float]
    temperatura_maxima_c: Optional[float]
    zonas_climaticas_preferidas: List[str]
    resistencias: List[str]
    es_hija_f1: bool
    es_variedad_antigua: bool
    fotos: List[str]
    created_at: datetime
    
    # Nested relationships
    especie: Optional[EspecieResponse] = None
    
    class Config:
        from_attributes = True


class VariedadUpdate(BaseModel):
    """Schema for updating variedad information"""
    nombre_variedad: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    color_fruto: Optional[str] = Field(None, max_length=100)
    sabor: Optional[str] = Field(None, max_length=255)
    tamanio_planta: Optional[str] = Field(None, max_length=50)
    profundidad_siembra_cm: Optional[float] = Field(None, ge=0)
    distancia_plantas_cm: Optional[float] = Field(None, ge=0)
    distancia_surcos_cm: Optional[float] = Field(None, ge=0)
    dias_germinacion_min: Optional[int] = Field(None, ge=0)
    dias_germinacion_max: Optional[int] = Field(None, ge=0)
    dias_hasta_cosecha_min: Optional[int] = Field(None, ge=0)
    dias_hasta_cosecha_max: Optional[int] = Field(None, ge=0)
    resistencias: Optional[List[str]] = None
    es_hija_f1: Optional[bool] = None
    es_variedad_antigua: Optional[bool] = None
    tipo_origen: Optional[str] = Field(None, max_length=50)
    procedencia: Optional[str] = Field(None, max_length=255)
    anno_recoleccion: Optional[int] = Field(None, ge=1900, le=2100)
    generacion: Optional[str] = Field(None, max_length=50)
    tipo_polinizacion: Optional[str] = Field(None, max_length=100)


# ============ Lote Semillas Schemas ============

class LoteSemillasBase(BaseModel):
    """Base lote semillas fields"""
    nombre_comercial: str = Field(..., min_length=1, max_length=500)
    marca: Optional[str] = Field(None, max_length=255)
    numero_lote: Optional[str] = Field(None, max_length=100)
    cantidad_estimada: Optional[int] = Field(None, ge=0)
    anno_produccion: Optional[int] = Field(None, ge=1900, le=2100)
    origen: Optional[str] = Field(None, max_length=255)  # "Latanina", "Huerta Urtzi", etc.
    tipo_origen: Optional[str] = Field(None, max_length=50)  # "compra", "propia", "intercambio", "herencia"
    anno_recoleccion: Optional[int] = Field(None, ge=1900, le=2100)
    generacion: Optional[str] = Field(None, max_length=100)  # "Original", "F2", "F3", etc.
    notas: Optional[str] = None


class LoteSemillasCreate(LoteSemillasBase):
    """Schema for creating a new lote"""
    variedad_id: int
    fecha_adquisicion: Optional[datetime] = None
    anos_viabilidad_semilla: Optional[int] = Field(None, ge=1, le=10)
    lugar_almacenamiento: Optional[str] = Field(None, max_length=255)
    temperatura_almacenamiento_c: Optional[float] = None
    humedad_relativa: Optional[float] = Field(None, ge=0, le=100)


class LoteSemillasUpdate(BaseModel):
    """Schema for updating lote information"""
    nombre_comercial: Optional[str] = Field(None, min_length=1, max_length=500)
    marca: Optional[str] = None
    numero_lote: Optional[str] = None
    cantidad_estimada: Optional[int] = Field(None, ge=0)
    cantidad_restante: Optional[int] = Field(None, ge=0)
    anno_produccion: Optional[int] = None
    origen: Optional[str] = Field(None, max_length=255)
    tipo_origen: Optional[str] = Field(None, max_length=50)
    anno_recoleccion: Optional[int] = None
    generacion: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[datetime] = None
    anos_viabilidad_semilla: Optional[int] = Field(None, ge=1, le=10)
    lugar_almacenamiento: Optional[str] = None
    temperatura_almacenamiento_c: Optional[float] = None
    humedad_relativa: Optional[float] = None
    estado: Optional[str] = Field(None, pattern="^(activo|agotado|vencido|descartado)$")
    notas: Optional[str] = None


class LoteSemillasResponse(LoteSemillasBase):
    """Response schema for lote semillas"""
    id: int
    usuario_id: int
    variedad_id: int
    fecha_adquisicion: Optional[datetime]
    anos_viabilidad_semilla: Optional[int]
    lugar_almacenamiento: Optional[str]
    temperatura_almacenamiento_c: Optional[float]
    humedad_relativa: Optional[float]
    estado: str
    cantidad_restante: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested relationships
    variedad: Optional[VariedadResponse] = None
    
    class Config:
        from_attributes = True


# ============ Plantacion Schemas ============

class PlantacionBase(BaseModel):
    """Base plantacion fields"""
    nombre_plantacion: str = Field(..., min_length=1, max_length=255)
    fecha_siembra: datetime
    tipo_siembra: str = Field(..., pattern="^(interior|exterior|terraza)$")
    cantidad_semillas_plantadas: Optional[int] = Field(None, ge=0)
    ubicacion_descripcion: Optional[str] = Field(None, max_length=255)
    notas: Optional[str] = None


class PlantacionCreate(PlantacionBase):
    """Schema for creating plantacion"""
    lote_semillas_id: int
    fotos: List[str] = Field(default_factory=list)


class PlantacionUpdate(BaseModel):
    """Schema for updating plantacion"""
    nombre_plantacion: Optional[str] = None
    estado: Optional[str] = Field(None, pattern="^(planificada|sembrada|germinada|trasplantada|crecimiento|cosecha_cercana|cosechada|cancelada)$")
    fecha_germinacion: Optional[datetime] = None
    fecha_trasplante: Optional[datetime] = None
    fecha_cosecha_estimada: Optional[datetime] = None
    notas: Optional[str] = None


class PlantacionResponse(PlantacionBase):
    """Response schema for plantacion"""
    id: int
    usuario_id: int
    lote_semillas_id: int
    estado: str
    fecha_germinacion: Optional[datetime]
    fecha_trasplante: Optional[datetime]
    fecha_cosecha_estimada: Optional[datetime]
    fotos: List[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============ OCR Result Schema ============

class OCRResult(BaseModel):
    """Schema for OCR extraction results"""
    raw_text: str
    extracted_data: LoteSemillasCreate
    confidence: float = Field(..., ge=0, le=1)


# ============ Push Notification Schemas ============

class PushSubscriptionCreate(BaseModel):
    """Schema for creating a push notification subscription"""
    endpoint: str = Field(..., min_length=1)
    expiration_time: Optional[datetime] = None
    keys: Dict[str, str] = Field(..., description="Must contain 'p256dh' and 'auth' keys")
    
    @validator('keys')
    @classmethod
    def validate_keys(cls, v):
        if 'p256dh' not in v or 'auth' not in v:
            raise ValueError("Keys must contain 'p256dh' and 'auth'")
        return v


class PushSubscriptionResponse(BaseModel):
    """Schema for push subscription in responses"""
    id: int
    endpoint: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationPayload(BaseModel):
    """Schema for notification content"""
    title: str = Field(..., max_length=255)
    body: str
    icon: Optional[str] = None
    badge: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# ============ Calendar Schemas ============

class CalendarTask(BaseModel):
    """Schema for a calendar task"""
    date: datetime
    task_type: str = Field(..., pattern="^(plant|transplant|harvest)$")
    seed_id: int
    seed_name: str
    description: str


class MonthlyCalendar(BaseModel):
    """Schema for monthly calendar view"""
    month: int = Field(..., ge=1, le=12)
    year: int
    tasks: List[CalendarTask]


# ============ Generic Response Schemas ============

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None
