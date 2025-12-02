"""
Seed management API routes.
Handles seed scanning with OCR, inventory CRUD, and CSV export.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv
from datetime import datetime

from app.api.schemas import SeedCreate, SeedUpdate, SeedResponse, OCRResult, MessageResponse
from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, Seed
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
    
    Returns extracted seed data that can be edited before saving.
    This does NOT create a seed entry yet.
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 photos allowed"
        )
    
    # Save photos temporarily
    temp_paths = await storage_service.save_seed_photos(
        user_id=current_user.id,
        seed_id=None,  # No seed ID yet
        files=files
    )
    
    try:
        # Process first image with OCR (others are just stored)
        first_image_path = storage_service.get_absolute_path(temp_paths[0])
        raw_text, seed_data, confidence = ocr_service.process_image(first_image_path)
        
        # Add all photo paths to seed data
        seed_data.photos = temp_paths
        
        return OCRResult(
            raw_text=raw_text,
            extracted_data=seed_data,
            confidence=confidence
        )
    
    except Exception as e:
        # Clean up temp files on error
        for path in temp_paths:
            storage_service.delete_file(path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("", response_model=SeedResponse, status_code=status.HTTP_201_CREATED)
async def create_seed(
    seed_data: SeedCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new seed entry in the inventory.
    
    Use this after scanning and reviewing the OCR-extracted data.
    All fields can be manually edited.
    """
    # Create seed entry
    new_seed = Seed(
        user_id=current_user.id,
        **seed_data.dict()
    )
    
    db.add(new_seed)
    db.commit()
    db.refresh(new_seed)
    
    return SeedResponse.from_orm(new_seed)


@router.get("", response_model=List[SeedResponse])
async def list_seeds(
    crop_family: Optional[str] = Query(None, description="Filter by crop family"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    variety: Optional[str] = Query(None, description="Filter by variety"),
    is_planted: Optional[bool] = Query(None, description="Filter by planted status"),
    search: Optional[str] = Query(None, description="Search in name, species, variety"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all seeds in the user's inventory with optional filters.
    
    - **crop_family**: Filter by crop family (e.g., "tomato", "lettuce")
    - **brand**: Filter by brand
    - **variety**: Filter by variety
    - **is_planted**: Filter by planted status
    - **search**: Search text in name, species, or variety
    """
    query = db.query(Seed).filter(Seed.user_id == current_user.id)
    
    # Apply filters
    if crop_family:
        query = query.filter(Seed.crop_family == crop_family)
    
    if brand:
        query = query.filter(Seed.brand.ilike(f"%{brand}%"))
    
    if variety:
        query = query.filter(Seed.variety.ilike(f"%{variety}%"))
    
    if is_planted is not None:
        query = query.filter(Seed.is_planted == is_planted)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Seed.commercial_name.ilike(search_filter)) |
            (Seed.species.ilike(search_filter)) |
            (Seed.variety.ilike(search_filter))
        )
    
    seeds = query.order_by(Seed.created_at.desc()).all()
    
    return [SeedResponse.from_orm(seed) for seed in seeds]


@router.get("/{seed_id}", response_model=SeedResponse)
async def get_seed(
    seed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific seed.
    """
    seed = db.query(Seed).filter(
        Seed.id == seed_id,
        Seed.user_id == current_user.id
    ).first()
    
    if not seed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seed not found"
        )
    
    return SeedResponse.from_orm(seed)


@router.put("/{seed_id}", response_model=SeedResponse)
async def update_seed(
    seed_id: int,
    seed_update: SeedUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update seed information.
    
    All fields are optional. Only provided fields will be updated.
    """
    seed = db.query(Seed).filter(
        Seed.id == seed_id,
        Seed.user_id == current_user.id
    ).first()
    
    if not seed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seed not found"
        )
    
    # Update only provided fields
    update_data = seed_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(seed, field, value)
    
    db.commit()
    db.refresh(seed)
    
    return SeedResponse.from_orm(seed)


@router.delete("/{seed_id}", response_model=MessageResponse)
async def delete_seed(
    seed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a seed from the inventory.
    
    This also deletes all associated photos.
    """
    seed = db.query(Seed).filter(
        Seed.id == seed_id,
        Seed.user_id == current_user.id
    ).first()
    
    if not seed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seed not found"
        )
    
    # Delete associated files
    storage_service.delete_seed_folder(current_user.id, seed_id)
    
    # Delete database entry
    db.delete(seed)
    db.commit()
    
    return MessageResponse(message="Seed deleted successfully")


@router.get("/export/csv")
async def export_seeds_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user's seed inventory to CSV file.
    
    Returns a downloadable CSV file with all seed information.
    """
    seeds = db.query(Seed).filter(Seed.user_id == current_user.id).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Commercial Name', 'Species', 'Variety', 'Brand',
        'Production Year', 'Expiration Date', 'Estimated Count',
        'Crop Family', 'Is Planted', 'Planting Date',
        'Germination Days', 'Days to Transplant', 'Days to Harvest',
        'Notes', 'Created At'
    ])
    
    # Write data rows
    for seed in seeds:
        writer.writerow([
            seed.id,
            seed.commercial_name,
            seed.species or '',
            seed.variety or '',
            seed.brand or '',
            seed.production_year or '',
            seed.expiration_date.strftime('%Y-%m-%d') if seed.expiration_date else '',
            seed.estimated_count or '',
            seed.crop_family or '',
            'Yes' if seed.is_planted else 'No',
            seed.planting_date.strftime('%Y-%m-%d') if seed.planting_date else '',
            seed.germination_days or '',
            seed.days_to_transplant or '',
            seed.days_to_harvest or '',
            seed.notes or '',
            seed.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    # Prepare response
    output.seek(0)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"lorapp_seeds_{timestamp}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
