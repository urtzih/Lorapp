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
import logging
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
logger = logging.getLogger(__name__)


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
        
        # Create LoteSemillasCreate with placeholder variedad_id
        # User MUST change this to a valid variedad_id before POST
        # NOTE: Photos are now stored at the Variedad level, not here
        lote_data = LoteSemillasCreate(
            variedad_id=0,  # Placeholder - user must select from UI
            nombre_comercial=lote_data_dict.get("nombre_comercial", "Semilla escaneada"),
            marca=lote_data_dict.get("marca"),
            anno_produccion=lote_data_dict.get("anno_produccion"),
            cantidad_estimada=lote_data_dict.get("cantidad_estimada"),
            lugar_almacenamiento=lote_data_dict.get("lugar_almacenamiento"),
            notas=lote_data_dict.get("notas")
        )
        
        # Store photo paths in temp for later use by frontend
        lote_data_dict["temporal_fotos"] = temp_paths
        
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
    
    Args:
        lote_id: ID of the lote to add photos to
        files: 1-5 image files (JPG, PNG, WebP)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Updated lote with new photos
        
    Raises:
        404: Lote not found or not owned by user
        400: Invalid file format or too many files
    """
    try:
        logger.info(f"[Photos] User {current_user.id} adding {len(files)} photos to lote {lote_id}")
        
        # Validate lote exists and belongs to user
        lote = db.query(LoteSemillas).filter(
            LoteSemillas.id == lote_id,
            LoteSemillas.usuario_id == current_user.id
        ).first()

        if not lote:
            logger.warning(f"[Photos] Lote {lote_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lote {lote_id} not found"
            )
        
        # Validate number of files
        if len(files) > 5:
            logger.warning(f"[Photos] Too many files: {len(files)} > 5")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 5 photos allowed per request"
            )
        
        if len(files) == 0:
            logger.warning(f"[Photos] No files provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file is required"
            )

        # Save photos
        logger.debug(f"[Photos] Saving {len(files)} photos for lote {lote_id}")
        new_paths = await storage_service.save_seed_photos(
            user_id=current_user.id,
            seed_id=lote_id,
            files=files
        )
        
        logger.info(f"[Photos] Successfully saved {len(new_paths)} photos for lote {lote_id}")

        # Update lote with new photos
        lote.variedad.fotos = (lote.variedad.fotos or []) + new_paths
        db.commit()
        db.refresh(lote)
        
        logger.info(f"[Photos] Variedad {lote.variedad_id} updated with new photos. Total photos: {len(lote.variedad.fotos)}")

        return LoteSemillasResponse.from_orm(lote)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[Photos] Error adding photos to lote {lote_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing photos: {str(e)}"
        )


@router.delete("/{lote_id}/photos", response_model=LoteSemillasResponse)
async def delete_lote_photo(
    lote_id: int,
    photo: str = Query(..., description="Relative photo path to remove"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a specific photo from a lote.
    
    Args:
        lote_id: ID of the lote
        photo: Relative file path of the photo to delete
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Updated lote with photo removed
        
    Raises:
        404: Lote not found or photo not found
    """
    try:
        logger.info(f"[Photos] User {current_user.id} deleting photo from lote {lote_id}: {photo}")
        
        # Validate lote exists and belongs to user
        lote = db.query(LoteSemillas).filter(
            LoteSemillas.id == lote_id,
            LoteSemillas.usuario_id == current_user.id
        ).first()

        if not lote:
            logger.warning(f"[Photos] Lote {lote_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lote {lote_id} not found"
            )

        # Check if photo exists in variedad (fotos are at Variedad level now)
        if not lote.variedad.fotos or photo not in lote.variedad.fotos:
            logger.warning(f"[Photos] Photo not found in variedad {lote.variedad_id}: {photo}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Photo not found: {photo}"
            )

        # Delete photo from filesystem
        logger.debug(f"[Photos] Deleting file: {photo}")
        storage_service.delete_file(photo)
        
        # Remove from variedad
        lote.variedad.fotos = [p for p in lote.variedad.fotos if p != photo]
        db.commit()
        db.refresh(lote)
        
        logger.info(f"[Photos] Successfully deleted photo from variedad {lote.variedad_id}. Remaining photos: {len(lote.variedad.fotos)}")

        return LoteSemillasResponse.from_orm(lote)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[Photos] Error deleting photo from lote {lote_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting photo: {str(e)}"
        )


@router.put("/{lote_id}/photos/set-principal", response_model=LoteSemillasResponse)
async def set_principal_photo(
    lote_id: int,
    photo: str = Query(..., description="Relative photo path to set as principal"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set a photo as the principal (first) photo for a lote.
    
    Args:
        lote_id: ID of the lote
        photo: Relative file path of the photo to set as principal
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Updated lote with reordered photos
        
    Raises:
        404: Lote not found or photo not found
    """
    try:
        logger.info(f"[Photos] User {current_user.id} setting principal photo for lote {lote_id}: {photo}")
        
        # Validate lote exists and belongs to user
        lote = db.query(LoteSemillas).filter(
            LoteSemillas.id == lote_id,
            LoteSemillas.usuario_id == current_user.id
        ).first()

        if not lote:
            logger.warning(f"[Photos] Lote {lote_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lote {lote_id} not found"
            )

        # Check if photo exists in variedad (fotos are at Variedad level now)
        if not lote.variedad.fotos or photo not in lote.variedad.fotos:
            logger.warning(f"[Photos] Photo not found in variedad {lote.variedad_id}: {photo}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Photo not found: {photo}"
            )

        # Move photo to first position
        fotos_list = lote.variedad.fotos.copy()
        fotos_list.remove(photo)
        fotos_list.insert(0, photo)
        lote.variedad.fotos = fotos_list
        
        db.commit()
        db.refresh(lote)
        
        logger.info(f"[Photos] Successfully set principal photo for variedad {lote.variedad_id}")

        return LoteSemillasResponse.from_orm(lote)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[Photos] Error setting principal photo for lote {lote_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting principal photo: {str(e)}"
        )


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


@router.options("/export/csv")
async def export_csv_options():
    """Handle OPTIONS request for CORS preflight"""
    return {"status": "ok"}


@router.get("/export/csv")
async def export_lotes_csv(
    export_type: str = Query("lotes", description="Type of export: 'all', 'lotes', 'especies'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user's seed data to CSV file with proper UTF-8 encoding.
    
    - **export_type**: 'all' for complete data, 'lotes' for batch info, 'especies' for species catalog
    
    Returns a downloadable CSV file with requested information.
    """
    try:
        logger.info(f"CSV export request from user {current_user.id}, type: {export_type}")
        
        if export_type == "especies":
            return await export_especies_csv(current_user, db)
        elif export_type == "all":
            return await export_all_csv(current_user, db)
        else:  # default to lotes
            return await export_lotes_only_csv(current_user, db)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in export_lotes_csv: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting CSV: {str(e)}"
        )


async def export_lotes_only_csv(current_user: User, db: Session):
    """
    Export user's seed inventory (lotes) to CSV file with proper UTF-8 encoding.
    
    Returns a downloadable CSV file with all lote information.
    """
    try:
        logger.info(f"CSV export request from user {current_user.id}")
        
        # Simple query without complex joins to avoid issues
        try:
            lotes = db.query(LoteSemillas).filter(
                LoteSemillas.usuario_id == current_user.id
            ).all()
            logger.info(f"Found {len(lotes)} lotes for user {current_user.id}")
        except Exception as db_error:
            logger.error(f"Database query error: {str(db_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error: {str(db_error)}"
            )
        
        # Create CSV in memory with UTF-8 encoding
        try:
            # Use StringIO for text mode
            output = io.StringIO()
            writer = csv.writer(output, quoting=csv.QUOTE_ALL, lineterminator='\n')
            
            # Write header with proper Spanish characters - using BOM-safe strings
            header = [
                'ID', 'Nombre Comercial', 'Especie', 'Variedad', 'Familia Cultivo',
                'Marca', 'Año Producción', 'Fecha Vencimiento', 'Estado',
                'Cantidad Estimada', 'Cantidad Restante', 'Lugar Almacenamiento',
                'Origen', 'Generación', 'Notas', 'Fecha Creación'
            ]
            writer.writerow(header)
            logger.info(f"Wrote CSV header: {header}")
            
            # Write data rows
            rows_written = 0
            error_count = 0
            
            for lote in lotes:
                try:
                    # Get related data safely
                    especie_nombre = ''
                    familia_cultivo = ''
                    variedad_nombre = ''
                    
                    # Try to access variedad data
                    if lote.variedad:
                        try:
                            variedad_nombre = lote.variedad.nombre_variedad or ''
                        except Exception as e:
                            logger.warning(f"Error accessing variedad for lote {lote.id}: {e}")
                        
                        # Try to access especie data through variedad
                        if lote.variedad.especie:
                            try:
                                especie_nombre = lote.variedad.especie.nombre_comun or ''
                                familia_cultivo = lote.variedad.especie.familia_botanica or ''
                            except Exception as e:
                                logger.warning(f"Error accessing especie for lote {lote.id}: {e}")
                    
                    # Prepare row data - everything as string to avoid encoding issues
                    row_data = [
                        str(lote.id or ''),
                        str(lote.nombre_comercial or ''),
                        especie_nombre,
                        variedad_nombre,
                        familia_cultivo,
                        str(lote.marca or ''),
                        str(lote.anno_produccion or ''),
                        (datetime.now() + timedelta(days=365 * (lote.anos_viabilidad_semilla or 1))).strftime('%Y-%m-%d') if lote.anos_viabilidad_semilla else '',
                        str(lote.estado.value if lote.estado else ''),  # Get enum value
                        str(lote.cantidad_estimada or ''),
                        str(lote.cantidad_restante or ''),
                        str(lote.lugar_almacenamiento or ''),
                        str(lote.origen or ''),  # Origen del lote
                        str(lote.generacion or ''),  # Generación del lote
                        str(lote.notas or ''),
                        lote.created_at.strftime('%Y-%m-%d %H:%M:%S') if lote.created_at else ''
                    ]
                    
                    writer.writerow(row_data)
                    rows_written += 1
                    
                    if rows_written % 10 == 0:
                        logger.debug(f"Wrote {rows_written} rows so far")
                    
                except Exception as row_error:
                    error_count += 1
                    logger.error(f"Error writing row for lote {lote.id}: {str(row_error)}", exc_info=True)
                    continue
            
            logger.info(f"CSV export completed: wrote {rows_written} rows, {error_count} errors")
            
            # Get CSV content
            output.seek(0)
            csv_content = output.getvalue()
            output.close()
            
            logger.info(f"CSV content length: {len(csv_content)} chars")
            
            if rows_written == 0:
                logger.warning("CSV export produced no data rows")
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"lorapp_lotes_{timestamp}.csv"
            
            # Convert to UTF-8 bytes with BOM for proper encoding in Excel
            csv_bytes = csv_content.encode('utf-8-sig')
            logger.info(f"CSV bytes prepared: {len(csv_bytes)} bytes")
            
            # Return as bytes with proper encoding headers
            def generate():
                yield csv_bytes
            
            return StreamingResponse(
                generate(),
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Content-Encoding": "utf-8",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache"
                }
            )
        except Exception as csv_error:
            logger.error(f"CSV creation error: {str(csv_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating CSV: {str(csv_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in export_lotes_only_csv: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting CSV: {str(e)}"
        )


async def export_especies_csv(current_user: User, db: Session):
    """
    Export species catalog to CSV file.
    """
    try:
        logger.info(f"CSV especies export request from user {current_user.id}")
        
        # Get all species with their varieties
        especies = db.query(Especie).options(joinedload(Especie.variedades)).all()
        logger.info(f"Found {len(especies)} species")
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL, lineterminator='\n')
        
        # Write header
        header = [
            'ID Especie', 'Nombre Común', 'Nombre Científico', 'Familia Botánica',
            'Género', 'Tipo Cultivo', 'Descripción',
            'Variedades (nombres)'
        ]
        writer.writerow(header)
        
        # Write data rows
        for especie in especies:
            variedades_nombres = ', '.join([v.nombre_variedad for v in especie.variedades if v.nombre_variedad])
            
            row_data = [
                str(especie.id or ''),
                str(especie.nombre_comun or ''),
                str(especie.nombre_cientifico or ''),
                str(especie.familia_botanica or ''),
                str(especie.genero or ''),
                str(especie.tipo_cultivo or ''),
                str(especie.descripcion or ''),
                variedades_nombres
            ]
            writer.writerow(row_data)
        
        # Get CSV content
        output.seek(0)
        csv_content = output.getvalue()
        output.close()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"lorapp_especies_{timestamp}.csv"
        
        # Convert to UTF-8 bytes with BOM
        csv_bytes = csv_content.encode('utf-8-sig')
        
        def generate():
            yield csv_bytes
        
        return StreamingResponse(
            generate(),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Encoding": "utf-8",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
        )
    except Exception as e:
        logger.error(f"Error in export_especies_csv: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting especies CSV: {str(e)}"
        )


async def export_all_csv(current_user: User, db: Session):
    """
    Export complete data (lotes with full species and variety information) to CSV.
    """
    try:
        logger.info(f"CSV complete export request from user {current_user.id}")
        
        # Get all lotes for the user with full joins
        lotes = db.query(LoteSemillas).filter(
            LoteSemillas.usuario_id == current_user.id
        ).options(
            joinedload(LoteSemillas.variedad).joinedload(Variedad.especie)
        ).all()
        
        logger.info(f"Found {len(lotes)} lotes for complete export")
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL, lineterminator='\n')
        
        # Write comprehensive header
        header = [
            'ID Lote', 'Nombre Comercial', 'Marca', 'Año Producción', 'Fecha Vencimiento',
            'Estado', 'Cantidad Estimada', 'Cantidad Restante', 'Lugar Almacenamiento',
            'Origen', 'Generación', 'Notas Lote',
            'ID Variedad', 'Nombre Variedad', 'Tipo Polinización', 'Descripción Variedad',
            'ID Especie', 'Nombre Común', 'Nombre Científico', 'Familia Botánica',
            'Días Germinación Min', 'Días Germinación Max',
            'Temperatura Mínima (°C)', 'Temperatura Máxima (°C)',
            'Días Hasta Trasplante', 'Días Hasta Cosecha Min', 'Días Hasta Cosecha Max',
            'Fecha Creación Lote'
        ]
        writer.writerow(header)
        
        # Write data rows
        for lote in lotes:
            # Get variedad data
            variedad_id = ''
            variedad_nombre = ''
            tipo_origen = ''
            variedad_desc = ''
            
            # Get especie data
            especie_id = ''
            especie_nombre = ''
            especie_cientifica = ''
            familia = ''
            dias_germ_min = ''
            dias_germ_max = ''
            temp_germ_min = ''
            temp_germ_max = ''
            dias_trasplante = ''
            dias_cosecha_min = ''
            dias_cosecha_max = ''
            
            if lote.variedad:
                variedad_id = str(lote.variedad.id or '')
                variedad_nombre = str(lote.variedad.nombre_variedad or '')
                tipo_origen = str(lote.variedad.tipo_polinizacion or '')
                variedad_desc = str(lote.variedad.descripcion or '')
                
                # Datos de cultivo de la variedad
                dias_germ_min = str(lote.variedad.dias_germinacion_min or '')
                dias_germ_max = str(lote.variedad.dias_germinacion_max or '')
                temp_germ_min = str(lote.variedad.temperatura_minima_c or '')
                temp_germ_max = str(lote.variedad.temperatura_maxima_c or '')
                dias_trasplante = str(lote.variedad.dias_hasta_trasplante or '')
                dias_cosecha_min = str(lote.variedad.dias_hasta_cosecha_min or '')
                dias_cosecha_max = str(lote.variedad.dias_hasta_cosecha_max or '')
                
                if lote.variedad.especie:
                    especie_id = str(lote.variedad.especie.id or '')
                    especie_nombre = str(lote.variedad.especie.nombre_comun or '')
                    especie_cientifica = str(lote.variedad.especie.nombre_cientifico or '')
                    familia = str(lote.variedad.especie.familia_botanica or '')
            
            row_data = [
                str(lote.id or ''),
                str(lote.nombre_comercial or ''),
                str(lote.marca or ''),
                str(lote.anno_produccion or ''),
                (datetime.now() + timedelta(days=365 * (lote.anos_viabilidad_semilla or 1))).strftime('%Y-%m-%d') if lote.anos_viabilidad_semilla else '',
                str(lote.estado.value if lote.estado else ''),
                str(lote.cantidad_estimada or ''),
                str(lote.cantidad_restante or ''),
                str(lote.lugar_almacenamiento or ''),
                str(lote.origen or ''),
                str(lote.generacion or ''),
                str(lote.notas or ''),
                variedad_id,
                variedad_nombre,
                tipo_origen,
                variedad_desc,
                especie_id,
                especie_nombre,
                especie_cientifica,
                familia,
                dias_germ_min,
                dias_germ_max,
                temp_germ_min,
                temp_germ_max,
                dias_trasplante,
                dias_cosecha_min,
                dias_cosecha_max,
                lote.created_at.strftime('%Y-%m-%d %H:%M:%S') if lote.created_at else ''
            ]
            writer.writerow(row_data)
        
        # Get CSV content
        output.seek(0)
        csv_content = output.getvalue()
        output.close()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"lorapp_completo_{timestamp}.csv"
        
        # Convert to UTF-8 bytes with BOM
        csv_bytes = csv_content.encode('utf-8-sig')
        
        def generate():
            yield csv_bytes
        
        return StreamingResponse(
            generate(),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Encoding": "utf-8",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
        )
    except Exception as e:
        logger.error(f"Error in export_all_csv: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting complete CSV: {str(e)}"
        )


@router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import lotes from a CSV file.
    
    Flexible columnas: acepta cualquier subset de las columnas esperadas.
    Valores vacíos se guardan como NULL en la BDD.
    
    Requiere columnas: ID_Variedad, Nombre Comercial
    """
    try:
        logger.info(f"CSV import request from user {current_user.id}")
        
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser un CSV"
            )
        
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8-sig')  # Handle BOM
        
        # Parse CSV
        csv_file = io.StringIO(content_str)
        reader = csv.DictReader(csv_file)
        
        if not reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV vacío o sin columnas"
            )
        
        imported_count = 0
        error_rows = []
        
        # Mapeo entre nombres de columnas CSV y atributos del modelo
        # Acepta múltiples variantes de nombres
        field_mapping = {
            'ID_Variedad': 'variedad_id',
            'ID': 'variedad_id',  # Variante corta
            'Nombre Comercial': 'nombre_comercial',
            'Nombre comercial': 'nombre_comercial',
            'Marca': 'marca',
            'Número de Lote': 'numero_lote',
            'Numero Lote': 'numero_lote',
            'Cantidad Estimada': 'cantidad_estimada',
            'Cantidad estimada': 'cantidad_estimada',
            'Año Producción': 'anno_produccion',
            'Año producción': 'anno_produccion',
            'Año Recolección': 'anno_recoleccion',
            'Año recolección': 'anno_recoleccion',
            'Lugar Almacenamiento': 'lugar_almacenamiento',
            'Lugar almacenamiento': 'lugar_almacenamiento',
            'Temperatura Almacenamiento (°C)': 'temperatura_almacenamiento_c',
            'Temperatura almacenamiento': 'temperatura_almacenamiento_c',
            'Humedad Relativa (%)': 'humedad_relativa',
            'Humedad relativa': 'humedad_relativa',
            'Humedad': 'humedad_relativa',
            'Estado': 'estado',
            'Cantidad Restante': 'cantidad_restante',
            'Cantidad restante': 'cantidad_restante',
            'Origen': 'origen',
            'Tipo Origen': 'tipo_origen',
            'Tipo origen': 'tipo_origen',
            'Generación': 'generacion',
            'Generacion': 'generacion',
            'Notas': 'notas',
        }
        
        # Encontrar variantes de columnas en el CSV
        actual_to_standard = {}
        for csv_col in reader.fieldnames:
            if csv_col in field_mapping:
                actual_to_standard[csv_col] = field_mapping[csv_col]
        
        # Validar que tenemos al menos las columnas requeridas
        has_variedad_id = any(field_mapping.get(col) == 'variedad_id' for col in actual_to_standard.keys())
        has_nombre = any(field_mapping.get(col) == 'nombre_comercial' for col in actual_to_standard.keys())
        
        if not has_variedad_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV debe incluir columna 'ID' o 'ID_Variedad'"
            )
        
        if not has_nombre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV debe incluir columna 'Nombre Comercial'"
            )
        
        logger.info(f"Columnas detectadas: {list(actual_to_standard.keys())}")
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Obtener variedad_id y nombre_comercial
                variedad_id_str = ''
                nombre_comercial = ''
                
                for csv_col, model_field in actual_to_standard.items():
                    if model_field == 'variedad_id':
                        variedad_id_str = row.get(csv_col, '').strip()
                    elif model_field == 'nombre_comercial':
                        nombre_comercial = row.get(csv_col, '').strip()
                
                if not variedad_id_str:
                    error_rows.append({
                        'fila': row_num,
                        'nombre': nombre_comercial or '(S/N)',
                        'error': 'Falta ID o ID_Variedad'
                    })
                    continue
                
                if not nombre_comercial:
                    error_rows.append({
                        'fila': row_num,
                        'nombre': f'ID:{variedad_id_str}',
                        'error': 'Falta Nombre Comercial'
                    })
                    continue
                
                # Validar y convertir variedad_id
                try:
                    variedad_id = int(variedad_id_str)
                except ValueError:
                    error_rows.append({
                        'fila': row_num,
                        'nombre': nombre_comercial,
                        'error': f'ID_Variedad inválido: "{variedad_id_str}"'
                    })
                    continue
                
                # Validar que la variedad existe
                variedad = db.query(Variedad).filter(Variedad.id == variedad_id).first()
                if not variedad:
                    error_rows.append({
                        'fila': row_num,
                        'nombre': nombre_comercial,
                        'error': f'Variedad ID {variedad_id} no encontrada'
                    })
                    continue
                
                # Construir el lote
                lote_data = {
                    'usuario_id': current_user.id,
                    'variedad_id': variedad_id,
                    'nombre_comercial': nombre_comercial
                }
                
                # Procesar campos opcionales
                for csv_col, model_field in actual_to_standard.items():
                    if model_field not in ['variedad_id', 'nombre_comercial']:
                        value = row.get(csv_col, '').strip() if row.get(csv_col) else None
                        
                        # Conversión de tipos
                        try:
                            if model_field in ['cantidad_estimada', 'anno_produccion', 
                                             'anno_recoleccion', 'cantidad_restante']:
                                lote_data[model_field] = int(value) if value else None
                            
                            elif model_field in ['temperatura_almacenamiento_c', 'humedad_relativa']:
                                lote_data[model_field] = float(value) if value else None
                            
                            else:
                                # Campos de texto
                                lote_data[model_field] = value
                        
                        except ValueError as conv_err:
                            error_rows.append({
                                'fila': row_num,
                                'nombre': nombre_comercial,
                                'error': f'Campo "{csv_col}" tiene valor inválido: "{value}"'
                            })
                            continue
                
                # Crear y guardar el lote
                try:
                    nuevo_lote = LoteSemillas(**lote_data)
                    db.add(nuevo_lote)
                    db.commit()
                    imported_count += 1
                    logger.info(f"✓ Lote importado: {nombre_comercial} (variedad_id={variedad_id})")
                    
                except Exception as db_error:
                    db.rollback()
                    error_rows.append({
                        'fila': row_num,
                        'nombre': nombre_comercial,
                        'error': f'Error BD: {str(db_error)[:100]}'
                    })
                    continue
                
            except Exception as row_error:
                logger.error(f"Error fila {row_num}: {str(row_error)}")
                error_rows.append({
                    'fila': row_num,
                    'nombre': '(error)',
                    'error': f'Error inesperado: {str(row_error)[:100]}'
                })
                continue
        
        return {
            "success": len(error_rows) == 0,
            "message": f"Importación completada: {imported_count} importados, {len(error_rows)} errores",
            "imported": imported_count,
            "errors": error_rows,
            "total_errors": len(error_rows)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in import_csv: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importando CSV: {str(e)}"
        )


