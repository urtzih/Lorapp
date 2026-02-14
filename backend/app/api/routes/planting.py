"""
Planting Guide API routes.
Handles Square Foot Gardening guide and planting information.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import logging

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, Especie, Variedad, SquareFootGardening
from pydantic import BaseModel, Field
from datetime import datetime


router = APIRouter(prefix="/planting", tags=["Planting"])
logger = logging.getLogger(__name__)


# ============ Schemas ============

class SquareFootGardeningData(BaseModel):
    """Datos de Square Foot Gardening con los 3 métodos"""
    plantas_original: Optional[int] = Field(None, description="Plantas por cuadrado - Método original SFG")
    plantas_multisow: Optional[int] = Field(None, description="Plantas por cuadrado - Siembra múltiple")  
    plantas_macizo: Optional[int] = Field(None, description="Plantas por cuadrado - Siembra en macizo")
    espaciado_cm: Optional[float] = Field(None, description="Espaciado entre plantas en cm")
    notas: Optional[str] = Field(None, description="Notas especiales")
    
    class Config:
        from_attributes = True


class SquareFootGardeningInfo(BaseModel):
    """Square Foot Gardening information for a plant"""
    square_foot_plants: Optional[int] = Field(None, description="Number of plants per 30x30cm square")
    square_foot_spacing: Optional[float] = Field(None, description="Spacing between plants in cm")
    square_foot_notes: Optional[str] = Field(None, description="Special notes for SFG")
    distancia_plantas_cm: Optional[float] = Field(None, description="General plant spacing")
    profundidad_siembra_cm: Optional[float] = Field(None, description="Planting depth")
    
    class Config:
        from_attributes = True


class PlantingGuideResponse(BaseModel):
    """Response schema for planting guide"""
    id: int
    nombre_comun: str
    nombre_cientifico: Optional[str] = None
    tipo_cultivo: Optional[str] = None
    descripcion: Optional[str] = None
    
    # Square Foot Gardening info (datos de la tabla dedicada)
    square_foot_gardening: Optional[SquareFootGardeningData] = None
    
    # General planting info
    profundidad_siembra_cm: Optional[float] = None
    distancia_plantas_cm: Optional[float] = None
    distancia_surcos_cm: Optional[float] = None
    
    # Growth cycle
    dias_germinacion_min: Optional[int] = None
    dias_germinacion_max: Optional[int] = None
    dias_hasta_cosecha_min: Optional[int] = None
    dias_hasta_cosecha_max: Optional[int] = None
    
    # Conditions
    frecuencia_riego: Optional[str] = None
    exposicion_solar: Optional[str] = None
    
    class Config:
        from_attributes = True


class VariedadPlantingGuideResponse(BaseModel):
    """Response schema for variedad planting guide"""
    id: int
    nombre_variedad: str
    especie_nombre_comun: str
    especie_id: int
    
    # Square Foot Gardening info (from variedad or especie)
    square_foot_plants: Optional[int]
    square_foot_spacing: Optional[float]
    square_foot_notes: Optional[str]
    
    # General planting info
    profundidad_siembra_cm: Optional[float]
    distancia_plantas_cm: Optional[float]
    distancia_surcos_cm: Optional[float]
    
    # Growth cycle
    dias_germinacion_min: Optional[int]
    dias_germinacion_max: Optional[int]
    dias_hasta_cosecha_min: Optional[int]
    dias_hasta_cosecha_max: Optional[int]
    
    class Config:
        from_attributes = True


# ============ Routes ============

@router.get("/guide", response_model=List[PlantingGuideResponse])
async def get_planting_guide(
    search: Optional[str] = Query(None, description="Search by plant name"),
    tipo_cultivo: Optional[str] = Query(None, description="Filter by crop type"),
    has_square_foot_data: bool = Query(False, description="Only show plants with SFG data"),
    db: Session = Depends(get_db)
):
    """
    Get Square Foot Gardening guide with planting information for all species.
    
    - **search**: Search by common or scientific name
    - **tipo_cultivo**: Filter by crop type (hortalizas, hierbas, flores, etc.)
    - **has_square_foot_data**: Only return plants with Square Foot Gardening data
    
    Returns comprehensive planting information for each species.
    """
    # Usar SQL directo para evitar problemas con columnas inexistentes en el modelo
    from sqlalchemy import text
    
    # Construir la consulta base
    base_query = """
        SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.tipo_cultivo, e.descripcion, e.created_at, e.updated_at
        FROM especies e
        LEFT JOIN square_foot_gardening sfg ON e.id = sfg.especie_id
        WHERE 1=1
    """
    
    filters = []
    params = {}
    
    # Aplicar filtros
    if search:
        filters.append("(LOWER(e.nombre_comun) LIKE LOWER(:search) OR LOWER(e.nombre_cientifico) LIKE LOWER(:search))")
        params["search"] = f"%{search}%"
    
    if tipo_cultivo:
        filters.append("LOWER(e.tipo_cultivo) LIKE LOWER(:tipo_cultivo)")
        params["tipo_cultivo"] = f"%{tipo_cultivo}%"
    
    if has_square_foot_data:
        filters.append("sfg.id IS NOT NULL")
    
    if filters:
        base_query += " AND " + " AND ".join(filters)
    
    base_query += " ORDER BY e.nombre_comun"
    
    # Ejecutar consulta
    result = db.execute(text(base_query), params).fetchall()
    
    # Construir respuestas con datos SFG
    results = []
    for row in result:
        especie_id, nombre_comun, nombre_cientifico, tipo_cultivo, descripcion, created_at, updated_at = row
        
        # Buscar datos SFG para esta especie
        sfg_data = db.query(SquareFootGardening).filter(
            SquareFootGardening.especie_id == especie_id
        ).first()
        
        data = {
            "id": especie_id,
            "nombre_comun": nombre_comun,
            "nombre_cientifico": nombre_cientifico,
            "tipo_cultivo": tipo_cultivo,
            "descripcion": descripcion,
            "profundidad_siembra_cm": None,
            "distancia_plantas_cm": None,
            "distancia_surcos_cm": None,
            "dias_germinacion_min": None,
            "dias_germinacion_max": None,
            "dias_hasta_cosecha_min": None,
            "dias_hasta_cosecha_max": None,
            "frecuencia_riego": None,
            "exposicion_solar": None,
            "square_foot_gardening": None
        }
        
        # Añadir datos SFG si existen
        if sfg_data:
            data["square_foot_gardening"] = SquareFootGardeningData.model_validate(sfg_data)
        
        results.append(PlantingGuideResponse(**data))
    
    return results


@router.get("/guide/{especie_id}", response_model=PlantingGuideResponse)
async def get_planting_guide_by_species(
    especie_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed Square Foot Gardening information for a specific species.
    """
    especie = db.query(Especie).filter(Especie.id == especie_id).first()
    
    if not especie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species with id {especie_id} not found"
        )
    
    # Construir respuesta manualmente para evitar campos no disponibles
    data = {
        "id": especie.id,
        "nombre_comun": especie.nombre_comun,
        "nombre_cientifico": especie.nombre_cientifico,
        "tipo_cultivo": especie.tipo_cultivo,
        "descripcion": especie.descripcion,
        "profundidad_siembra_cm": None,
        "distancia_plantas_cm": None,
        "distancia_surcos_cm": None,
        "dias_germinacion_min": None,
        "dias_germinacion_max": None, 
        "dias_hasta_cosecha_min": None,
        "dias_hasta_cosecha_max": None,
        "frecuencia_riego": None,
        "exposicion_solar": None,
        "square_foot_gardening": None
    }
    
    if especie.square_foot_gardening:
        data["square_foot_gardening"] = SquareFootGardeningData.model_validate(especie.square_foot_gardening)
    
    return PlantingGuideResponse(**data)


@router.get("/guide/variedad/{variedad_id}", response_model=VariedadPlantingGuideResponse)
async def get_planting_guide_by_variedad(
    variedad_id: int,
    db: Session = Depends(get_db)
):
    """
    Get Square Foot Gardening information for a specific variedad.
    Falls back to especie data if variedad doesn't have specific SFG info.
    """
    variedad = db.query(Variedad).filter(Variedad.id == variedad_id).first()
    
    if not variedad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variedad with id {variedad_id} not found"
        )
    
    especie = db.query(Especie).filter(Especie.id == variedad.especie_id).first()
    
    # Build response with variedad data, falling back to especie
    response_data = {
        "id": variedad.id,
        "nombre_variedad": variedad.nombre_variedad,
        "especie_nombre_comun": especie.nombre_comun if especie else "Unknown",
        "especie_id": variedad.especie_id,
        
        # SFG data - variedad overrides especie
        "square_foot_plants": variedad.square_foot_plants or (especie.square_foot_plants if especie else None),
        "square_foot_spacing": variedad.square_foot_spacing or (especie.square_foot_spacing if especie else None),
        "square_foot_notes": variedad.square_foot_notes or (especie.square_foot_notes if especie else None),
        
        # Planting data - variedad overrides especie
        "profundidad_siembra_cm": variedad.profundidad_siembra_cm or (especie.profundidad_siembra_cm if especie else None),
        "distancia_plantas_cm": variedad.distancia_plantas_cm or (especie.distancia_plantas_cm if especie else None),
        "distancia_surcos_cm": variedad.distancia_surcos_cm or (especie.distancia_surcos_cm if especie else None),
        
        # Growth cycle
        "dias_germinacion_min": variedad.dias_germinacion_min or (especie.dias_germinacion_min if especie else None),
        "dias_germinacion_max": variedad.dias_germinacion_max or (especie.dias_germinacion_max if especie else None),
        "dias_hasta_cosecha_min": variedad.dias_hasta_cosecha_min or (especie.dias_hasta_cosecha_min if especie else None),
        "dias_hasta_cosecha_max": variedad.dias_hasta_cosecha_max or (especie.dias_hasta_cosecha_max if especie else None),
    }
    
    return VariedadPlantingGuideResponse(**response_data)


@router.get("/stats", response_model=dict)
async def get_planting_stats(
    db: Session = Depends(get_db)
):
    """
    Get statistics about the planting guide database.
    """
    total_especies = db.query(Especie).count()
    especies_with_sfg = db.query(Especie).filter(Especie.square_foot_plants.isnot(None)).count()
    total_variedades = db.query(Variedad).count()
    
    return {
        "total_especies": total_especies,
        "especies_with_square_foot_data": especies_with_sfg,
        "total_variedades": total_variedades,
        "coverage_percentage": round((especies_with_sfg / total_especies * 100) if total_especies > 0 else 0, 2)
    }
