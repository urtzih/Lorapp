"""
Lote Semillas management API routes.
Handles seed lot scanning with OCR, inventory CRUD, and CSV export.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import io
import csv
from datetime import datetime

from app.api.schemas import (
    LoteSemillasCreate, LoteSemillasUpdate, LoteSemillasResponse,
    VariedadUpdate, VariedadResponse, EspecieUpdate, EspecieResponse,
    OCRResult, MessageResponse
)
from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, LoteSemillas, Variedad, Especie
from app.infrastructure.ocr.vision_service import ocr_service
from app.infrastructure.storage.file_service import storage_service


router = APIRouter(prefix="/seeds", tags=["Seeds"])


@router.post("/scan", response_model=OCRResult)
async def scan_seed_packet(
    files: List[UploadFile] = File(..., description="Seed packet photos (1-5 images)"),
    current_user: User = Depends(get_current_user)
):
    """
    Scan seed packet photos and extract information using OCR.
    
    - **files**: 1-5 photos of the seed packet
    
    Returns extracted lote data that can be edited before saving.
    
    IMPORTANT: The user MUST select variedad_id from the UI before creating the lote.
    The OCR cannot determine the correct variedad_id automatically.
    The response includes _extracted_species and _extracted_variety as hints.
    
    This does NOT create a lote entry yet.
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 photos allowed"
        )
    
    # Save photos temporarily
    temp_paths = await storage_service.save_seed_photos(
        user_id=current_user.id,
        seed_id=None,  # No lote ID yet
        files=files
    )
    
    try:
        # Process first image with OCR (others are just stored)
        first_image_path = storage_service.get_absolute_path(temp_paths[0])
        raw_text, lote_data_dict, confidence = ocr_service.process_image(first_image_path)
        
        # Add photo paths
        lote_data_dict["fotos"] = temp_paths
        
        # Create LoteSemillasCreate with placeholder variedad_id
        # User MUST change this to a valid variedad_id before POST
        lote_data = LoteSemillasCreate(
            variedad_id=0,  # Placeholder - user must select from UI
            nombre_comercial=lote_data_dict.get("nombre_comercial", "Semilla escaneada"),
            marca=lote_data_dict.get("marca"),
            anno_produccion=lote_data_dict.get("anno_produccion"),
            fecha_vencimiento=lote_data_dict.get("fecha_vencimiento"),
            cantidad_estimada=lote_data_dict.get("cantidad_estimada"),
            lugar_almacenamiento=lote_data_dict.get("lugar_almacenamiento"),
            notas=lote_data_dict.get("notas"),
            fotos=temp_paths
        )
        
        return OCRResult(
            raw_text=raw_text,
            extracted_data=lote_data,
            confidence=confidence
        )
    
    except Exception as e:
        # Clean up temp files on error
        for path in temp_paths:
            storage_service.delete_file(path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        ) from e


@router.post("", response_model=LoteSemillasResponse, status_code=status.HTTP_201_CREATED)
async def create_lote(
    lote_data: LoteSemillasCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new lote entry in the inventory.
    
    Use this after scanning and reviewing the OCR-extracted data.
    All fields can be manually edited.
    """
    # Verify variedad exists
    variedad = db.query(Variedad).filter(Variedad.id == lote_data.variedad_id).first()
    if not variedad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variedad with id {lote_data.variedad_id} not found"
        )
    
    # Create lote entry
    new_lote = LoteSemillas(
        usuario_id=current_user.id,
        **lote_data.dict()
    )
    
    db.add(new_lote)
    db.commit()
    db.refresh(new_lote)
    
    return LoteSemillasResponse.from_orm(new_lote)


@router.get("", response_model=List[LoteSemillasResponse])
async def list_lotes(
    estado: Optional[str] = Query(None, description="Filter by estado", pattern="^(activo|agotado|vencido|descartado)$"),
    marca: Optional[str] = Query(None, description="Filter by marca"),
    search: Optional[str] = Query(None, description="Search in nombre comercial"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all lotes in the user's inventory with optional filters.
    
    - **estado**: Filter by estado (activo, agotado, vencido, descartado)
    - **marca**: Filter by marca
    - **search**: Search text in nombre comercial
    """
    query = db.query(LoteSemillas).filter(
        LoteSemillas.usuario_id == current_user.id
    ).options(
        joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
    )
    
    # Apply filters
    if estado:
        query = query.filter(LoteSemillas.estado == estado)
    
    if marca:
        query = query.filter(LoteSemillas.marca.ilike(f"%{marca}%"))
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            LoteSemillas.nombre_comercial.ilike(search_filter)
        )
    
    lotes = query.order_by(LoteSemillas.created_at.desc()).all()
    
    return [LoteSemillasResponse.from_orm(lote) for lote in lotes]


@router.get("/{lote_id}", response_model=LoteSemillasResponse)
async def get_lote(
    lote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific lote.
    """
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == lote_id,
        LoteSemillas.usuario_id == current_user.id
    ).options(
        joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
    ).first()
    
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote not found"
        )
    
    return LoteSemillasResponse.from_orm(lote)


@router.put("/{lote_id}", response_model=LoteSemillasResponse)
async def update_lote(
    lote_id: int,
    lote_update: LoteSemillasUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update lote information.
    
    All fields are optional. Only provided fields will be updated.
    """
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == lote_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()
    
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote not found"
        )
    
    # Update only provided fields
    update_data = lote_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lote, field, value)
    
    db.commit()
    db.refresh(lote)
    
    return LoteSemillasResponse.from_orm(lote)


@router.post("/{lote_id}/photos", response_model=LoteSemillasResponse)
async def add_lote_photos(
    lote_id: int,
    files: List[UploadFile] = File(..., description="Seed packet photos (1-5 images)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add photos to an existing lote.
    """
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == lote_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()

    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote not found"
        )

    new_paths = await storage_service.save_seed_photos(
        user_id=current_user.id,
        seed_id=lote_id,
        files=files
    )

    lote.fotos = (lote.fotos or []) + new_paths
    db.commit()
    db.refresh(lote)

    return LoteSemillasResponse.from_orm(lote)


@router.delete("/{lote_id}/photos", response_model=LoteSemillasResponse)
async def delete_lote_photo(
    lote_id: int,
    photo: str = Query(..., description="Relative photo path to remove"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a specific photo from a lote.
    """
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == lote_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()

    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote not found"
        )

    if not lote.fotos or photo not in lote.fotos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )

    storage_service.delete_file(photo)
    lote.fotos = [p for p in lote.fotos if p != photo]
    db.commit()
    db.refresh(lote)

    return LoteSemillasResponse.from_orm(lote)


@router.put("/variedades/{variedad_id}", response_model=VariedadResponse)
async def update_variedad(
    variedad_id: int,
    variedad_update: VariedadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update variedad information for a user's lote.
    """
    variedad = db.query(Variedad).join(
        LoteSemillas, LoteSemillas.variedad_id == Variedad.id
    ).filter(
        Variedad.id == variedad_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()

    if not variedad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variedad not found"
        )

    update_data = variedad_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(variedad, field, value)

    db.commit()
    db.refresh(variedad)

    return VariedadResponse.from_orm(variedad)


@router.put("/especies/{especie_id}", response_model=EspecieResponse)
async def update_especie(
    especie_id: int,
    especie_update: EspecieUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update especie information for a user's lote.
    """
    especie = db.query(Especie).join(
        Variedad, Variedad.especie_id == Especie.id
    ).join(
        LoteSemillas, LoteSemillas.variedad_id == Variedad.id
    ).filter(
        Especie.id == especie_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()

    if not especie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Especie not found"
        )

    update_data = especie_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(especie, field, value)

    db.commit()
    db.refresh(especie)

    return EspecieResponse.from_orm(especie)


@router.delete("/{lote_id}", response_model=MessageResponse)
async def delete_lote(
    lote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a lote from the inventory.
    
    This also deletes all associated photos.
    """
    lote = db.query(LoteSemillas).filter(
        LoteSemillas.id == lote_id,
        LoteSemillas.usuario_id == current_user.id
    ).first()
    
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote not found"
        )
    
    # Delete associated files
    storage_service.delete_seed_folder(current_user.id, lote_id)
    
    # Delete database entry
    db.delete(lote)
    db.commit()
    
    return MessageResponse(message="Lote deleted successfully")


@router.get("/export/csv")
async def export_lotes_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user's seed inventory (lotes) to CSV file.
    
    Returns a downloadable CSV file with all lote information.
    """
    lotes = db.query(LoteSemillas).options(
        joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
    ).filter(LoteSemillas.usuario_id == current_user.id).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header (Spanish)
    writer.writerow([
        'ID', 'Nombre Comercial', 'Especie', 'Variedad', 'Familia Cultivo',
        'Marca', 'Año Producción', 'Fecha Vencimiento', 'Estado',
        'Cantidad Estimada', 'Cantidad Restante', 'Lugar Almacenamiento',
        'Días Germinación', 'Días Hasta Trasplante', 'Días Hasta Cosecha',
        'Tipo Origen', 'Notas', 'Fecha Creación'
    ])
    
    # Write data rows
    for lote in lotes:
        especie = lote.variedad.especie if lote.variedad else None
        writer.writerow([
            lote.id,
            lote.nombre_comercial or '',
            especie.nombre_comun if especie else '',
            lote.variedad.nombre_variedad if lote.variedad else '',
            especie.familia_cultivo if especie else '',
            lote.marca or '',
            lote.anno_produccion or '',
            lote.fecha_vencimiento.strftime('%Y-%m-%d') if lote.fecha_vencimiento else '',
            lote.estado,
            lote.cantidad_estimada or '',
            lote.cantidad_restante or '',
            lote.lugar_almacenamiento or '',
            especie.dias_germinacion if especie else '',
            especie.dias_hasta_trasplante if especie else '',
            especie.dias_hasta_cosecha if especie else '',
            lote.variedad.tipo_origen if lote.variedad else '',
            lote.notas or '',
            lote.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    # Prepare response
    output.seek(0)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"lorapp_lotes_{timestamp}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

