"""
Google Cloud Vision OCR service.
Extracts text from seed packet images and parses seed information.
"""

import re
from typing import Dict, Any, Optional
from datetime import datetime
from google.cloud import vision
from google.cloud.vision_v1 import types


class VisionOCRService:
    """
    Service for extracting seed information from images using Google Cloud Vision API.
    """
    
    def __init__(self):
        """Initialize Google Vision client"""
        try:
            self.client = vision.ImageAnnotatorClient()
        except Exception as e:  # pylint: disable=broad-except
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
            raise RuntimeError("Google Cloud Vision API is not configured. Please check your credentials.")
            
        response = self.client.text_detection(image=image)  # pyright: ignore[reportAttributeAccessIssue]
        
        if response.error.message:
            raise RuntimeError(f"OCR Error: {response.error.message}")
        
        texts = response.text_annotations
        if texts:
            return texts[0].description  # First annotation contains full text
        
        return ""
    
    def parse_seed_information(self, text: str) -> Dict[str, Any]:
        """
        Parse seed packet information from OCR text.
        Uses regex patterns and keyword detection to extract structured data.
        
        NOTE: This returns partial data compatible with LoteSemillasCreate.
        The user must manually select variedad_id (required FK) from frontend.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Dictionary with extracted lote data (without variedad_id)
        """
        text_lower = text.lower()
        lines = text.split('\n')
        
        lote_data = {
            "nombre_comercial": None,
            "marca": None,
            "anno_produccion": None,
            # NOTE: fecha_vencimiento is no longer used, use anos_viabilidad_semilla instead
            "cantidad_estimada": None,
            "lugar_almacenamiento": None,
            "notas": None,
            # For reference only (not in LoteSemillasCreate, but useful for UI)
            "_extracted_species": None,
            "_extracted_variety": None,
        }
        
        # Extract commercial name (usually first few lines, capitalized)
        for line in lines[:5]:
            if line.strip() and len(line) > 3:
                # Look for capitalized text or prominent names
                if line.isupper() or any(word[0].isupper() for word in line.split() if len(word) > 3):
                    lote_data["nombre_comercial"] = line.strip()
                    break
        
        # Extract variety (store as reference for user to match)
        variety_patterns = [
            r'variedad[:\s]+([^\n]+)',
            r'variety[:\s]+([^\n]+)',
            r'var\.[:\s]+([^\n]+)',
        ]
        for pattern in variety_patterns:
            match = re.search(pattern, text_lower)
            if match:
                lote_data["_extracted_variety"] = match.group(1).strip()
                break
        
        # Extract species (store as reference)
        species_patterns = [
            r'especie[:\s]+([^\n]+)',
            r'species[:\s]+([^\n]+)',
        ]
        for pattern in species_patterns:
            match = re.search(pattern, text_lower)
            if match:
                lote_data["_extracted_species"] = match.group(1).strip()
                break
        
        # If no explicit species, try to detect from common names
        if not lote_data["_extracted_species"]:
            lote_data["_extracted_species"] = self._detect_species_from_text(text_lower)
        
        # Extract brand (common Spanish/Basque seed brands)
        brands = ["fitó", "semillas batlle", "rocalba", "intersemillas", "ramiro arnedo", "vilmorin"]
        for brand in brands:
            if brand in text_lower:
                lote_data["marca"] = brand.title()
                break
        
        # Extract production year
        year_match = re.search(r'(?:año|year|producción|production)[:\s]*(\d{4})', text_lower)
        if year_match:
            lote_data["anno_produccion"] = int(year_match.group(1))
        else:
            # Look for any 4-digit year between 2015-2030
            year_match = re.search(r'\b(20[1-3][0-9])\b', text)
            if year_match:
                lote_data["anno_produccion"] = int(year_match.group(1))
        
        # NOTE: Expiration date extraction removed - use anos_viabilidad_semilla field instead
        # which is set by the user when creating/editing a lote
        
        # Extract quantity if mentioned
        qty_patterns = [
            r'(?:cantidad|quantity|semillas|seeds)[:\s]*(\d+)',
            r'(\d+)[\s]*(?:semillas|seeds)',
        ]
        for pattern in qty_patterns:
            match = re.search(pattern, text_lower)
            if match:
                lote_data["cantidad_estimada"] = int(match.group(1))
                break
        
        # Store any additional info as notes
        notes_parts = []
        if lote_data.get("_extracted_species"):
            notes_parts.append(f"Especie detectada: {lote_data['_extracted_species']}")
        if lote_data.get("_extracted_variety"):
            notes_parts.append(f"Variedad detectada: {lote_data['_extracted_variety']}")
        
        if notes_parts:
            lote_data["notas"] = " | ".join(notes_parts)
        
        # Remove None values
        return {k: v for k, v in lote_data.items() if v is not None}
    
    def _detect_species_from_text(self, text: str) -> Optional[str]:
        """
        Detect species name from text using keyword matching.
        Returns Spanish common name to help user find correct variedad.
        
        Args:
            text: OCR text (lowercase)
            
        Returns:
            Species common name (Spanish) or None
        """
        species_keywords = {
            "Tomate": ["tomate", "tomato", "lycopersicon"],
            "Lechuga": ["lechuga", "lettuce", "lactuca"],
            "Pimiento": ["pimiento", "pepper", "capsicum"],
            "Pepino": ["pepino", "cucumber", "cucumis"],
            "Calabacín": ["calabacín", "calabacin", "zucchini"],
            "Zanahoria": ["zanahoria", "carrot", "daucus"],
            "Cebolla": ["cebolla", "onion", "allium"],
            "Judía": ["judía", "judia", "alubia", "bean", "phaseolus"],
            "Guisante": ["guisante", "pea", "pisum"],
            "Rábano": ["rábano", "rabano", "radish", "raphanus"],
            "Espinaca": ["espinaca", "spinach", "spinacia"],
            "Albahaca": ["albahaca", "basil", "ocimum"],
            "Perejil": ["perejil", "parsley", "petroselinum"],
            "Calabaza": ["calabaza", "pumpkin", "squash", "cucurbita"],
            "Berenjena": ["berenjena", "eggplant", "aubergine", "solanum"],
            "Acelga": ["acelga", "chard", "beta"],
            "Rúcula": ["rúcula", "rucula", "arugula", "rocket", "eruca"],
            "Cilantro": ["cilantro", "coriander", "coriandrum"],
            "Col": ["col", "repollo", "cabbage", "brassica"],
        }
        
        for species_name, keywords in species_keywords.items():
            if any(keyword in text for keyword in keywords):
                return species_name
        
        return None
    
    def process_image(self, image_path: str) -> tuple[str, Dict[str, Any], float]:
        """
        Process seed packet image: extract text and parse seed information.
        
        Args:
            image_path: Path to the seed packet image
            
        Returns:
            Tuple of (raw_text, parsed_lote_data_dict, confidence)
            
        Note:
            Returns a dictionary with partial LoteSemillas data.
            variedad_id MUST be provided by the user before saving to database.
            The dict includes _extracted_species and _extracted_variety as hints
            to help the user select the correct variedad_id from the UI.
        """
        # Extract text
        raw_text = self.extract_text_from_image(image_path)
        
        # Parse seed information
        lote_info = self.parse_seed_information(raw_text)
        
        # Calculate confidence based on how many fields were extracted
        # Core fields for seed lot identification
        core_fields = ["nombre_comercial", "marca", "anno_produccion"]
        extracted_core = sum(1 for field in core_fields if field in lote_info)
        confidence = min(extracted_core / len(core_fields), 1.0)
        
        return raw_text, lote_info, confidence


# Global OCR service instance
ocr_service = VisionOCRService()
