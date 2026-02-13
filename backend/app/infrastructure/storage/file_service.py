"""
File storage service for handling seed packet photo uploads.
Manages file upload, validation, and organization in the filesystem.
Includes compression and optimization for web delivery.
"""

import os
import uuid
import shutil
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


class FileStorageService:
    """
    Service for managing file uploads and storage.
    Organizes files by user and seed for easy management.
    Optimizes images for web delivery with aggressive compression.
    """
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.max_file_size = settings.MAX_UPLOAD_SIZE
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        
        # Image optimization settings
        self.max_width = 1920  # Max width for display
        self.max_height = 1800  # Max height for display
        self.quality = 75  # JPEG quality (0-100)
        self.thumbnail_size = (200, 200)  # Thumbnail for previews
    
    async def save_seed_photos(
        self,
        user_id: int,
        seed_id: Optional[int],
        files: List[UploadFile]
    ) -> List[str]:
        """
        Save and optimize multiple seed packet photos.
        
        Creates readable filenames with format:
        - principal_{timestamp}_{random}.jpg (for first/main photo)
        - secondary_{timestamp}_{random}_{index}.jpg (for additional photos)
        
        Args:
            user_id: User ID who owns the seed
            seed_id: Seed ID (None if creating new seed)
            files: List of uploaded image files
            
        Returns:
            List of relative file paths (sorted with principal first)
            
        Raises:
            HTTPException: If file validation fails
        """
        saved_paths = []
        
        # Create directory structure: uploads/seeds/{user_id}/{seed_id}/
        seed_folder = f"temp_{uuid.uuid4().hex[:8]}" if seed_id is None else str(seed_id)
        dir_path = os.path.join(self.upload_dir, "seeds", str(user_id), seed_folder)
        os.makedirs(dir_path, exist_ok=True)
        
        logger.info(f"[Storage] Saving {len(files)} photos for user {user_id}, seed {seed_id}")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_suffix = uuid.uuid4().hex[:6]
        
        for idx, file in enumerate(files):
            try:
                # Validate file
                self._validate_file(file)
                
                # Generate readable filename
                file_extension = os.path.splitext(file.filename)[1].lower()
                
                # First file is principal photo
                if idx == 0:
                    filename = f"principal_{timestamp}_{random_suffix}{file_extension}"
                else:
                    filename = f"secondary_{timestamp}_{random_suffix}_{idx}{file_extension}"
                
                file_path = os.path.join(dir_path, filename)
                
                logger.debug(f"[Storage] Processing file: {file.filename} → {filename}")
                
                # Save file
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                logger.debug(f"[Storage] Original file size: {os.path.getsize(file_path)} bytes")
                
                # Optimize and compress image aggressively
                self._optimize_image(file_path, is_thumbnail=(idx > 0))
                
                optimized_size = os.path.getsize(file_path)
                logger.info(f"[Storage] Optimized file size: {optimized_size} bytes")
                
                # Store relative path
                relative_path = os.path.relpath(file_path, self.upload_dir)
                saved_paths.append(relative_path.replace("\\", "/"))  # Normalize path separators
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"[Storage] Error processing file {file.filename}: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing image {file.filename}: {str(e)}"
                )
        
        logger.info(f"[Storage] Successfully saved {len(saved_paths)} optimized photos")
        return saved_paths
    
    def _validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file (extension and size).
        
        Args:
            file: Uploaded file
            
        Raises:
            HTTPException: If validation fails
        """
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in self.allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}"
            )
        
        # Note: File size validation happens at FastAPI level with python-multipart
    
    def _optimize_image(self, file_path: str, is_thumbnail: bool = False) -> None:
        """
        Aggressive image optimization for web delivery.
        
        Reduces file size while maintaining acceptable quality:
        - Resize if too large
        - Convert RGBA to RGB
        - Compress with optimized settings
        - Use WebP for better compression (if available)
        
        Args:
            file_path: Path to the image file
            is_thumbnail: If True, create smaller version for previews
        """
        try:
            logger.debug(f"[Optimize] Starting optimization: {file_path}")
            
            with Image.open(file_path) as img:
                original_format = img.format
                logger.debug(f"[Optimize] Original format: {original_format}, Size: {img.size}, Mode: {img.mode}")
                
                # Convert to RGB if necessary (removes transparency, reduces size)
                if img.mode in ('RGBA', 'LA', 'P'):
                    logger.debug(f"[Optimize] Converting from {img.mode} to RGB")
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = rgb_img
                
                # Resize if too large (for thumbnails or large images)
                width, height = img.size
                if is_thumbnail or width > self.max_width or height > self.max_height:
                    if is_thumbnail:
                        # Create thumbnail for secondary photos
                        target_size = self.thumbnail_size
                        logger.debug(f"[Optimize] Creating thumbnail: {width}x{height} → {target_size}")
                    else:
                        # Resize main photo
                        ratio = min(self.max_width / width, self.max_height / height)
                        target_width = int(width * ratio)
                        target_height = int(height * ratio)
                        target_size = (target_width, target_height)
                        logger.debug(f"[Optimize] Resizing: {width}x{height} → {target_width}x{target_height}")
                    
                    img.thumbnail(target_size, Image.Resampling.LANCZOS)
                
                # Get output format
                output_format = 'JPEG'
                quality = self.quality if not is_thumbnail else 70
                
                # Save optimized image with quality settings
                logger.debug(f"[Optimize] Saving as {output_format} with quality {quality}")
                img.save(
                    file_path,
                    format=output_format,
                    quality=quality,
                    optimize=True,
                    progressive=True  # Progressive JPEG for better web loading
                )
                
                logger.debug(f"[Optimize] Optimization complete")
                
        except Exception as e:
            logger.warning(f"[Optimize] Error optimizing {file_path}: {str(e)}. Keeping original.")
            # If optimization fails, keep original file
    
    def delete_file(self, file_path: str) -> None:
        """
        Delete a file from storage.
        
        Args:
            file_path: Relative path to the file
        """
        full_path = os.path.join(self.upload_dir, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    
    def delete_seed_folder(self, user_id: int, seed_id: int) -> None:
        """
        Delete entire seed folder when seed is deleted.
        
        Args:
            user_id: User ID
            seed_id: Seed ID
        """
        dir_path = os.path.join(self.upload_dir, "seeds", str(user_id), str(seed_id))
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
    
    def get_absolute_path(self, relative_path: str) -> str:
        """
        Convert relative path to absolute path.
        
        Args:
            relative_path: Relative path from upload directory
            
        Returns:
            Absolute file path
        """
        return os.path.join(self.upload_dir, relative_path)


# Global storage service instance
storage_service = FileStorageService()
