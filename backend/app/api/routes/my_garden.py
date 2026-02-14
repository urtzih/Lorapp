"""
My Garden API routes - Manejo de plantaciones en la huerta.
Endpoints para registrar y monitorear plantaciones directas en la huerta.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, Plantacion, LoteSemillas, Variedad, Especie, EstadoPlantacion


router = APIRouter(prefix="/my-garden", tags=["My Garden"])


# ============ Schemas ============

class PlantingCreate(BaseModel):
    """Schema para crear una plantación en huerta"""
    lote_semillas_id: int
    nombre_plantacion: str
    fecha_siembra: date
    tipo_siembra: str = "exterior"  # "exterior", "terraza", "maceta"
    ubicacion_descripcion: Optional[str] = None
    cantidad_semillas_plantadas: Optional[int] = None
    notas: Optional[str] = None


class PlantingUpdate(BaseModel):
    """Schema para actualizar una plantación"""
    nombre_plantacion: Optional[str] = None
    estado: Optional[str] = None
    fecha_germinacion: Optional[date] = None
    fecha_trasplante: Optional[date] = None
    fecha_cosecha_estimada: Optional[date] = None
    ubicacion_descripcion: Optional[str] = None
    cantidad_semillas_plantadas: Optional[int] = None
    notas: Optional[str] = None


class PlantingResponse(BaseModel):
    """Schema de respuesta para una plantación"""
    id: int
    usuario_id: int
    lote_semillas_id: int
    nombre_plantacion: str
    fecha_siembra: datetime
    tipo_siembra: str
    cantidad_semillas_plantadas: Optional[int] = None
    ubicacion_descripcion: Optional[str] = None
    estado: str
    fecha_germinacion: Optional[datetime] = None
    fecha_trasplante: Optional[datetime] = None
    fecha_cosecha_estimada: Optional[datetime] = None
    notas: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Información relacionada
    variedad_nombre: Optional[str] = None
    especie_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ Endpoints ============

@router.get("/", response_model=List[PlantingResponse])
async def list_garden_plantings(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar plantaciones en la huerta (estados avanzados: trasplantada, crecimiento, cosecha, cosechada).
    Excluye plantaciones en fase de semillero.
    """
    # Estados que corresponden a "huerta" (después del trasplante)
    garden_states = [
        EstadoPlantacion.TRASPLANTADA,
        EstadoPlantacion.CRECIMIENTO,
        EstadoPlantacion.COSECHA_CERCANA,
        EstadoPlantacion.COSECHADA
    ]
    
    query = db.query(Plantacion)\
        .join(LoteSemillas, Plantacion.lote_semillas_id == LoteSemillas.id)\
        .join(Variedad, LoteSemillas.variedad_id == Variedad.id)\
        .join(Especie, Variedad.especie_id == Especie.id)\
        .filter(
            Plantacion.usuario_id == current_user.id,
            Plantacion.estado.in_(garden_states)
        )
    
    # Aplicar filtros
    if status_filter:
        try:
            estado_enum = EstadoPlantacion(status_filter)
            query = query.filter(Plantacion.estado == estado_enum)
        except ValueError:
            pass  # Ignorar filtro inválido
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Plantacion.nombre_plantacion.ilike(search_filter),
                Especie.nombre_comun.ilike(search_filter),
                Variedad.nombre_variedad.ilike(search_filter)
            )
        )
    
    plantings = query.order_by(Plantacion.created_at.desc()).all()
    
    # Construir respuestas con información relacionada
    results = []
    for planting in plantings:
        data = PlantingResponse.from_orm(planting)
        data.variedad_nombre = planting.lote_semillas.variedad.nombre_variedad if planting.lote_semillas and planting.lote_semillas.variedad else None
        data.especie_nombre = planting.lote_semillas.variedad.especie.nombre_comun if planting.lote_semillas and planting.lote_semillas.variedad and planting.lote_semillas.variedad.especie else None
        results.append(data)
    
    return results


@router.post("/", response_model=PlantingResponse, status_code=status.HTTP_201_CREATED)
async def create_garden_planting(
    planting: PlantingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear una nueva plantación directa en la huerta.
    Estado inicial: TRASPLANTADA (ya que es directo en huerta).
    """
    # Verificar que el lote existe y pertenece al usuario
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == planting.lote_semillas_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()
    
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de semillas no encontrado"
        )
    
    # Crear plantación
    new_planting = Plantacion(
        usuario_id=current_user.id,
        lote_semillas_id=planting.lote_semillas_id,
        nombre_plantacion=planting.nombre_plantacion,
        fecha_siembra=planting.fecha_siembra,
        tipo_siembra=planting.tipo_siembra,
        ubicacion_descripcion=planting.ubicacion_descripcion,
        cantidad_semillas_plantadas=planting.cantidad_semillas_plantadas,
        notas=planting.notas,
        estado=EstadoPlantacion.TRASPLANTADA  # Directa en huerta
    )
    
    db.add(new_planting)
    db.commit()
    db.refresh(new_planting)
    
    # Cargar información relacionada para la respuesta
    response = PlantingResponse.from_orm(new_planting)
    response.variedad_nombre = lote.variedad.nombre_variedad if lote.variedad else None
    response.especie_nombre = lote.variedad.especie.nombre_comun if lote.variedad and lote.variedad.especie else None
    
    return response


@router.get("/{planting_id}", response_model=PlantingResponse)
async def get_garden_planting(
    planting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener detalles de una plantación específica en la huerta.
    """
    planting = db.query(Plantacion).filter(
        Plantacion.id == planting_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not planting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantación no encontrada"
        )
    
    response = PlantingResponse.from_orm(planting)
    if planting.lote_semillas and planting.lote_semillas.variedad:
        response.variedad_nombre = planting.lote_semillas.variedad.nombre_variedad
        if planting.lote_semillas.variedad.especie:
            response.especie_nombre = planting.lote_semillas.variedad.especie.nombre_comun
    
    return response


@router.put("/{planting_id}", response_model=PlantingResponse)
async def update_garden_planting(
    planting_id: int,
    planting_update: PlantingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar una plantación en la huerta.
    """
    planting = db.query(Plantacion).filter(
        Plantacion.id == planting_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not planting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantación no encontrada"
        )
    
    # Actualizar campos
    update_data = planting_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "estado" and value:
            try:
                setattr(planting, field, EstadoPlantacion(value))
            except ValueError:
                pass  # Ignorar estado inválido
        else:
            setattr(planting, field, value)
    
    db.commit()
    db.refresh(planting)
    
    response = PlantingResponse.from_orm(planting)
    if planting.lote_semillas and planting.lote_semillas.variedad:
        response.variedad_nombre = planting.lote_semillas.variedad.nombre_variedad
        if planting.lote_semillas.variedad.especie:
            response.especie_nombre = planting.lote_semillas.variedad.especie.nombre_comun
    
    return response


@router.delete("/{planting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_garden_planting(
    planting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar una plantación de la huerta.
    """
    planting = db.query(Plantacion).filter(
        Plantacion.id == planting_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not planting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantación no encontrada"
        )
    
    db.delete(planting)
    db.commit()
    
    return None


@router.get("/stats/summary")
async def get_garden_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener estadísticas rápidas de la huerta.
    """
    garden_states = [
        EstadoPlantacion.TRASPLANTADA,
        EstadoPlantacion.CRECIMIENTO,
        EstadoPlantacion.COSECHA_CERCANA,
        EstadoPlantacion.COSECHADA
    ]
    
    total = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado.in_(garden_states)
    ).count()
    
    growing = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado == EstadoPlantacion.CRECIMIENTO
    ).count()
    
    ready = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado == EstadoPlantacion.COSECHA_CERCANA
    ).count()
    
    harvested = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado == EstadoPlantacion.COSECHADA
    ).count()
    
    return {
        "total": total,
        "growing": growing,
        "ready_to_harvest": ready,
        "harvested": harvested
    }
