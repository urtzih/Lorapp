"""
My Seedling API routes - Manejo de siembras en semillero.
Endpoints para registrar y monitorear semillas sembradas en semilleros antes del trasplante.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, Plantacion, LoteSemillas, Variedad, Especie, EstadoPlantacion


router = APIRouter(prefix="/my-seedling", tags=["My Seedling"])


# ============ Schemas ============

class SeedlingCreate(BaseModel):
    """Schema para crear una siembra en semillero"""
    lote_semillas_id: int
    nombre_plantacion: str
    fecha_siembra: date
    ubicacion_descripcion: Optional[str] = "Semillero"
    cantidad_semillas_plantadas: Optional[int] = None
    notas: Optional[str] = None


class SeedlingUpdate(BaseModel):
    """Schema para actualizar una siembra en semillero"""
    nombre_plantacion: Optional[str] = None
    estado: Optional[str] = None
    fecha_germinacion: Optional[date] = None
    ubicacion_descripcion: Optional[str] = None
    cantidad_semillas_plantadas: Optional[int] = None
    notas: Optional[str] = None


class SeedlingTransplant(BaseModel):
    """Schema para marcar una siembra como trasplantada"""
    fecha_trasplante: date
    ubicacion_descripcion: Optional[str] = None


class SeedlingResponse(BaseModel):
    """Schema de respuesta para una siembra en semillero"""
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
    notas: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Información relacionada
    variedad_nombre: Optional[str] = None
    especie_nombre: Optional[str] = None
    dias_desde_siembra: Optional[int] = None
    
    class Config:
        from_attributes = True


# ============ Endpoints ============

@router.get("/", response_model=List[SeedlingResponse])
async def list_seedlings(
    status_filter: Optional[str] = Query(None, description="Filter by status: germinating, germinada, ready"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar siembras en semillero (estados iniciales: planificada, sembrada, germinada).
    Excluye plantaciones ya trasplantadas a la huerta.
    """
    # Estados que corresponden a "semillero" (antes del trasplante)
    seedling_states = [
        EstadoPlantacion.PLANIFICADA,
        EstadoPlantacion.SEMBRADA,
        EstadoPlantacion.GERMINADA
    ]
    
    query = db.query(Plantacion)\
        .join(LoteSemillas, Plantacion.lote_semillas_id == LoteSemillas.id)\
        .join(Variedad, LoteSemillas.variedad_id == Variedad.id)\
        .join(Especie, Variedad.especie_id == Especie.id)\
        .filter(
            Plantacion.usuario_id == current_user.id,
            Plantacion.estado.in_(seedling_states)
        )
    
    # Aplicar filtros
    if status_filter:
        if status_filter == "germinating":
            query = query.filter(Plantacion.estado == EstadoPlantacion.SEMBRADA)
        elif status_filter == "germinada":
            query = query.filter(Plantacion.estado == EstadoPlantacion.GERMINADA)
        elif status_filter == "ready":
            # Germinada y lista para trasplantar (lógica adicional si es necesario)
            query = query.filter(Plantacion.estado == EstadoPlantacion.GERMINADA)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Plantacion.nombre_plantacion.ilike(search_filter),
                Especie.nombre_comun.ilike(search_filter),
                Variedad.nombre_variedad.ilike(search_filter)
            )
        )
    
    seedlings = query.order_by(Plantacion.created_at.desc()).all()
    
    # Construir respuestas con información relacionada
    results = []
    for seedling in seedlings:
        data = SeedlingResponse.from_orm(seedling)
        data.variedad_nombre = seedling.lote_semillas.variedad.nombre_variedad if seedling.lote_semillas and seedling.lote_semillas.variedad else None
        data.especie_nombre = seedling.lote_semillas.variedad.especie.nombre_comun if seedling.lote_semillas and seedling.lote_semillas.variedad and seedling.lote_semillas.variedad.especie else None
        
        # Calcular días desde siembra
        if seedling.fecha_siembra:
            delta = datetime.now() - seedling.fecha_siembra
            data.dias_desde_siembra = delta.days
        
        results.append(data)
    
    return results


@router.post("/", response_model=SeedlingResponse, status_code=status.HTTP_201_CREATED)
async def create_seedling(
    seedling: SeedlingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear una nueva siembra en semillero usando semillas del inventario.
    Estado inicial: SEMBRADA.
    """
    # Verificar que el lote existe y pertenece al usuario
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == seedling.lote_semillas_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()
    
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de semillas no encontrado"
        )
    
    # Crear siembra en semillero
    new_seedling = Plantacion(
        usuario_id=current_user.id,
        lote_semillas_id=seedling.lote_semillas_id,
        nombre_plantacion=seedling.nombre_plantacion,
        fecha_siembra=seedling.fecha_siembra,
        tipo_siembra="semillero",
        ubicacion_descripcion=seedling.ubicacion_descripcion or "Semillero",
        cantidad_semillas_plantadas=seedling.cantidad_semillas_plantadas,
        notas=seedling.notas,
        estado=EstadoPlantacion.SEMBRADA  # En semillero
    )
    
    db.add(new_seedling)
    db.commit()
    db.refresh(new_seedling)
    
    # Cargar información relacionada para la respuesta
    response = SeedlingResponse.from_orm(new_seedling)
    response.variedad_nombre = lote.variedad.nombre_variedad if lote.variedad else None
    response.especie_nombre = lote.variedad.especie.nombre_comun if lote.variedad and lote.variedad.especie else None
    response.dias_desde_siembra = 0
    
    return response


@router.get("/{seedling_id}", response_model=SeedlingResponse)
async def get_seedling(
    seedling_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener detalles de una siembra específica en semillero.
    """
    seedling = db.query(Plantacion).filter(
        Plantacion.id == seedling_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not seedling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Siembra no encontrada"
        )
    
    response = SeedlingResponse.from_orm(seedling)
    if seedling.lote_semillas and seedling.lote_semillas.variedad:
        response.variedad_nombre = seedling.lote_semillas.variedad.nombre_variedad
        if seedling.lote_semillas.variedad.especie:
            response.especie_nombre = seedling.lote_semillas.variedad.especie.nombre_comun
    
    if seedling.fecha_siembra:
        delta = datetime.now() - seedling.fecha_siembra
        response.dias_desde_siembra = delta.days
    
    return response


@router.put("/{seedling_id}", response_model=SeedlingResponse)
async def update_seedling(
    seedling_id: int,
    seedling_update: SeedlingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar una siembra en semillero.
    """
    seedling = db.query(Plantacion).filter(
        Plantacion.id == seedling_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not seedling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Siembra no encontrada"
        )
    
    # Actualizar campos
    update_data = seedling_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "estado" and value:
            try:
                setattr(seedling, field, EstadoPlantacion(value))
            except ValueError:
                pass  # Ignorar estado inválido
        else:
            setattr(seedling, field, value)
    
    db.commit()
    db.refresh(seedling)
    
    response = SeedlingResponse.from_orm(seedling)
    if seedling.lote_semillas and seedling.lote_semillas.variedad:
        response.variedad_nombre = seedling.lote_semillas.variedad.nombre_variedad
        if seedling.lote_semillas.variedad.especie:
            response.especie_nombre = seedling.lote_semillas.variedad.especie.nombre_comun
    
    if seedling.fecha_siembra:
        delta = datetime.now() - seedling.fecha_siembra
        response.dias_desde_siembra = delta.days
    
    return response


@router.patch("/{seedling_id}/transplant", response_model=SeedlingResponse)
async def transplant_seedling(
    seedling_id: int,
    transplant_data: SeedlingTransplant,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marcar una siembra como trasplantada a la huerta.
    Cambia el estado a TRASPLANTADA y la mueve de semillero a huerta.
    """
    seedling = db.query(Plantacion).filter(
        Plantacion.id == seedling_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not seedling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Siembra no encontrada"
        )
    
    # Actualizar estado a trasplantada
    seedling.estado = EstadoPlantacion.TRASPLANTADA
    seedling.fecha_trasplante = transplant_data.fecha_trasplante
    
    if transplant_data.ubicacion_descripcion:
        seedling.ubicacion_descripcion = transplant_data.ubicacion_descripcion
    
    # Cambiar tipo de siembra de "semillero" a "exterior" o "terraza"
    seedling.tipo_siembra = "exterior"
    
    db.commit()
    db.refresh(seedling)
    
    response = SeedlingResponse.from_orm(seedling)
    if seedling.lote_semillas and seedling.lote_semillas.variedad:
        response.variedad_nombre = seedling.lote_semillas.variedad.nombre_variedad
        if seedling.lote_semillas.variedad.especie:
            response.especie_nombre = seedling.lote_semillas.variedad.especie.nombre_comun
    
    if seedling.fecha_siembra:
        delta = datetime.now() - seedling.fecha_siembra
        response.dias_desde_siembra = delta.days
    
    return response


@router.delete("/{seedling_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_seedling(
    seedling_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar una siembra del semillero.
    """
    seedling = db.query(Plantacion).filter(
        Plantacion.id == seedling_id,
        Plantacion.usuario_id == current_user.id
    ).first()
    
    if not seedling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Siembra no encontrada"
        )
    
    db.delete(seedling)
    db.commit()
    
    return None


@router.get("/stats/summary")
async def get_seedling_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener estadísticas rápidas del semillero.
    """
    total = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado.in_([
            EstadoPlantacion.PLANIFICADA,
            EstadoPlantacion.SEMBRADA,
            EstadoPlantacion.GERMINADA
        ])
    ).count()
    
    germinating = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado == EstadoPlantacion.SEMBRADA
    ).count()
    
    germinated = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.estado == EstadoPlantacion.GERMINADA
    ).count()
    
    # Trasplantadas (para comparar con el total de siembras)
    transplanted = db.query(Plantacion).filter(
        Plantacion.usuario_id == current_user.id,
        Plantacion.tipo_siembra == "semillero",
        Plantacion.estado == EstadoPlantacion.TRASPLANTADA
    ).count()
    
    return {
        "total": total,
        "germinating": germinating,
        "ready": germinated,  # Germinadas y listas para trasplantar
        "transplanted": transplanted
    }
