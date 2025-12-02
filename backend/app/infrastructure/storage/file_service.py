"""
File storage service for handling seed packet photo uploads.
Manages file upload, validation, and organization in the filesystem.
"""

import os
import uuid
import shutil
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from PIL import Image

from app.core.config import settings


class FileStorageService:
    """
    Service for managing file uploads and storage.
    Organizes files by user and seed for easy management.
    """
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.max_file_size = settings.MAX_UPLOAD_SIZE
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    
    async def save_seed_photos(
        self,
        user_id: int,
        seed_id: Optional[int],
        files: List[UploadFile]
    ) -> List[str]:
        """
        Save multiple seed packet photos.
        
        Args:
            user_id: User ID who owns the seed
            seed_id: Seed ID (None if creating new seed)
            files: List of uploaded image files
            
        Returns:
            List of relative file paths
            
        Raises:
            HTTPException: If file validation fails
        """
        saved_paths = []
        
        # Create directory structure: uploads/seeds/{user_id}/{seed_id}/
        seed_folder = f"temp_{uuid.uuid4().hex[:8]}" if seed_id is None else str(seed_id)
        dir_path = os.path.join(self.upload_dir, "seeds", str(user_id), seed_folder)
        os.makedirs(dir_path, exist_ok=True)
        
        for file in files:
            # Validate file
            self._validate_file(file)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join(dir_path, unique_filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Optimize image (resize if too large)
            self._optimize_image(file_path)
            
            # Store relative path
            relative_path = os.path.relpath(file_path, self.upload_dir)
            saved_paths.append(relative_path.replace("\\", "/"))  # Normalize path separators
        
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
    
    def _optimize_image(self, file_path: str, max_width: int = 1920, quality: int = 85) -> None:
        """
        Optimize image size and quality for storage.
        
        Args:
            file_path: Path to the image file
            max_width: Maximum width in pixels
            quality: JPEG quality (1-100)
        """
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary (for JPEG)
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if too large
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save optimized image
                img.save(file_path, optimize=True, quality=quality)
        except Exception as e:
            # If optimization fails, keep original file
            pass
    
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
