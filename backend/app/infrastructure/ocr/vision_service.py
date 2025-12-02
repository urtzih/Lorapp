"""
Google Cloud Vision OCR service.
Extracts text from seed packet images and parses seed information.
"""

import os
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
from google.cloud import vision
from google.cloud.vision_v1 import types

from app.api.schemas import SeedCreate
from app.core.config import settings


class VisionOCRService:
    """
    Service for extracting seed information from images using Google Cloud Vision API.
    """
    
    def __init__(self):
        """Initialize Google Vision client"""
        try:
            self.client = vision.ImageAnnotatorClient()
        except Exception as e:
            print(f"Warning: Google Cloud Vision API not available: {e}")
            self.client = None
    
    def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract all text from an image using OCR.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text as a single string
        """
        with open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        image = types.Image(content=content)
        
        if not self.client:
            raise Exception("Google Cloud Vision API is not configured. Please check your credentials.")
            
        response = self.client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"OCR Error: {response.error.message}")
        
        texts = response.text_annotations
        if texts:
            return texts[0].description  # First annotation contains full text
        
        return ""
    
    def parse_seed_information(self, text: str) -> Dict[str, Any]:
        """
        Parse seed packet information from OCR text.
        Uses regex patterns and keyword detection to extract structured data.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Dictionary with extracted seed data
        """
        text_lower = text.lower()
        lines = text.split('\n')
        
        seed_data = {
            "commercial_name": None,
            "species": None,
            "variety": None,
            "brand": None,
            "production_year": None,
            "expiration_date": None,
            "germination_days": None,
            "planting_depth_cm": None,
            "spacing_cm": None,
        }
        
        # Extract commercial name (usually first few lines, capitalized)
        for line in lines[:5]:
            if line.strip() and len(line) > 3:
                # Look for capitalized text or prominent names
                if line.isupper() or any(word[0].isupper() for word in line.split() if len(word) > 3):
                    seed_data["commercial_name"] = line.strip()
                    break
        
        # Extract variety (look for keywords)
        variety_patterns = [
            r'variedad[:\s]+([^\n]+)',
            r'variety[:\s]+([^\n]+)',
            r'var\.[:\s]+([^\n]+)',
        ]
        for pattern in variety_patterns:
            match = re.search(pattern, text_lower)
            if match:
                seed_data["variety"] = match.group(1).strip()
                break
        
        # Extract brand (common Spanish/Basque seed brands)
        brands = ["fitó", "semillas batlle", "rocalba", "intersemillas", "ramiro arnedo", "vilmorin"]
        for brand in brands:
            if brand in text_lower:
                seed_data["brand"] = brand.title()
                break
        
        # Extract production year
        year_match = re.search(r'(?:año|year|producción|production)[:\s]*(\d{4})', text_lower)
        if year_match:
            seed_data["production_year"] = int(year_match.group(1))
        else:
            # Look for any 4-digit year between 2015-2030
            year_match = re.search(r'\b(20[1-3][0-9])\b', text)
            if year_match:
                seed_data["production_year"] = int(year_match.group(1))
        
        # Extract expiration date
        exp_patterns = [
            r'caducidad[:\s]*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            r'expir[a-z]*[:\s]*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            r'válido hasta[:\s]*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
        ]
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                day, month, year = match.groups()
                year = int(year)
                if year < 100:  # Convert 2-digit year
                    year += 2000
                try:
                    seed_data["expiration_date"] = datetime(year, int(month), int(day))
                except ValueError:
                    pass
                break
        
        # Extract germination days
        germ_match = re.search(r'germinación[:\s]*(\d+)[\s-]*(?:días|days)', text_lower)
        if germ_match:
            seed_data["germination_days"] = int(germ_match.group(1))
        
        # Extract planting depth
        depth_match = re.search(r'profundidad[:\s]*(\d+(?:\.\d+)?)[\s]*cm', text_lower)
        if depth_match:
            seed_data["planting_depth_cm"] = float(depth_match.group(1))
        
        # Extract spacing
        spacing_match = re.search(r'(?:marco|spacing)[:\s]*(\d+)[\s]*x[\s]*(\d+)[\s]*cm', text_lower)
        if spacing_match:
            seed_data["spacing_cm"] = float(spacing_match.group(1))
            seed_data["row_spacing_cm"] = float(spacing_match.group(2))
        
        # Determine crop family from common names
        seed_data["crop_family"] = self._detect_crop_family(text_lower)
        
        # Remove None values
        return {k: v for k, v in seed_data.items() if v is not None}
    
    def _detect_crop_family(self, text: str) -> Optional[str]:
        """
        Detect crop family from text using keyword matching.
        
        Args:
            text: OCR text (lowercase)
            
        Returns:
            Crop family name or None
        """
        crop_families = {
            "tomato": ["tomate", "tomato", "lycopersicon"],
            "lettuce": ["lechuga", "lettuce", "lactuca"],
            "pepper": ["pimiento", "pepper", "capsicum"],
            "cucumber": ["pepino", "cucumber", "cucumis"],
            "zucchini": ["calabacín", "calabacin", "zucchini", "cucurbita"],
            "carrot": ["zanahoria", "carrot", "daucus"],
            "onion": ["cebolla", "onion", "allium"],
            "bean": ["judía", "judia", "alubia", "bean", "phaseolus"],
            "pea": ["guisante", "pea", "pisum"],
            "radish": ["rábano", "rabano", "radish", "raphanus"],
            "spinach": ["espinaca", "spinach", "spinacia"],
            "basil": ["albahaca", "basil", "ocimum"],
            "parsley": ["perejil", "parsley", "petroselinum"],
        }
        
        for family, keywords in crop_families.items():
            if any(keyword in text for keyword in keywords):
                return family
        
        return None
    
    def process_image(self, image_path: str) -> tuple[str, SeedCreate, float]:
        """
        Process seed packet image: extract text and parse seed information.
        
        Args:
            image_path: Path to the seed packet image
            
        Returns:
            Tuple of (raw_text, parsed_seed_data, confidence)
        """
        # Extract text
        raw_text = self.extract_text_from_image(image_path)
        
        # Parse seed information
        seed_info = self.parse_seed_information(raw_text)
        
        # Calculate confidence based on how many fields were extracted
        total_fields = 10
        extracted_fields = len(seed_info)
        confidence = min(extracted_fields / total_fields, 1.0)
        
        # Create SeedCreate schema
        seed_data = SeedCreate(
            commercial_name=seed_info.get("commercial_name", "Unknown Seed"),
            **seed_info
        )
        
        return raw_text, seed_data, confidence


# Global OCR service instance
ocr_service = VisionOCRService()
