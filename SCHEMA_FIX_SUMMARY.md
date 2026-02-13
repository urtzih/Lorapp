# Schema Fix Summary

## Problema Identificado
Las definiciones de Pydantic en `schemas.py` no estaban sincronizadas con los cambios realizados en el modelo ORM (`models.py`). Después de las migraciones 005-008, los endpoints que devolvían `LoteSemillasResponse` fallaban con errores de validación de Pydantic.

## Cambios en la BD (Migraciones 005-008)

### Migration 005: Mover parámetros de cultivo de Especie a Variedad
- **Removed from Especie**: profundidad_siembra_cm, distancia_plantas_cm, distancia_surcos_cm, dias_germinacion_min/max, dias_hasta_trasplante, dias_hasta_cosecha_min/max, meses_siembra_interior/exterior
- **Added to Variedad**: Todos los campos anteriores

### Migration 006: Mover fotos de Lote a Variedad
- **Removed from LoteSemillas**: Campo `fotos` (ARRAY de strings)
- **Added to Variedad**: Campo `fotos` (JSON/ARRAY)
- **Razón**: Las fotos describe la variedad, no el lote

### Migration 007: Reemplazar fecha_vencimiento con anos_viabilidad_semilla
- **Removed from LoteSemillas**: `fecha_vencimiento` (DateTime)
- **Added to LoteSemillas**: `anos_viabilidad_semilla` (Integer, 1-10 anos)
- **Razón**: La viabilidad es una propiedad de la variedad, no del lote

### Migration 008: Remover redundancia
- **Removed from LoteSemillas**: `nivel_viabilidad` (redundante con anos_viabilidad_semilla)

## Errores de Validación Encontrados

```
pydantic_core._pydantic_core.ValidationError: 11 validation errors for LoteSemillasResponse
fotos - Field required [missing] (LoteSemillasResponse esperaba fotos aquí)
variedad.especie.profundidad_siembra_cm - Field required [missing] (EspecieResponse esperaba esto)
variedad.especie.distancia_plantas_cm - Field required [missing]
variedad.especie.dias_germinacion_min - Field required [missing]
... (y 6 más)
```

## Correcciones Realizadas

### 1. **schemas.py** - Actualizar definiciones de respuesta

#### EspecieResponse
**Antes:**
```python
class EspecieResponse(EspecieBase):
    id: int
    profundidad_siembra_cm: Optional[float]
    distancia_plantas_cm: Optional[float]
    distancia_surcos_cm: Optional[float]
    dias_germinacion_min: Optional[int]
    dias_germinacion_max: Optional[int]
    dias_hasta_trasplante: Optional[int]
    dias_hasta_cosecha_min: Optional[int]
    dias_hasta_cosecha_max: Optional[int]
    meses_siembra_interior: List[int]
    meses_siembra_exterior: List[int]
    created_at: datetime
```

**Después:**
```python
class EspecieResponse(EspecieBase):
    """Response schema for Especie (solo información taxonómica básica)"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### VariedadResponse
**Cambio:** Añadir todos los parámetros de cultivo + campo fotos

```python
class VariedadResponse(VariedadBase):
    """Response schema for Variedad (con toda la información de cultivo y fotos)"""
    id: int
    especie_id: int
    # ... todos los campos de base ...
    profundidad_siembra_cm: Optional[float]
    distancia_plantas_cm: Optional[float]
    distancia_surcos_cm: Optional[float]
    dias_germinacion_min: Optional[int]
    dias_germinacion_max: Optional[int]
    dias_hasta_trasplante: Optional[int]
    dias_hasta_cosecha_min: Optional[int]
    dias_hasta_cosecha_max: Optional[int]
    meses_siembra_interior: List[int]
    meses_siembra_exterior: List[int]
    fotos: List[str]  # ← Ahora está aquí
    created_at: datetime
    especie: Optional[EspecieResponse] = None
```

#### LoteSemillasCreate
```python
class LoteSemillasCreate(LoteSemillasBase):
    variedad_id: int
    fecha_adquisicion: Optional[datetime] = None
    anos_viabilidad_semilla: Optional[int] = Field(None, ge=1, le=10)  # ← Reemplaza fecha_vencimiento
    lugar_almacenamiento: Optional[str] = Field(None, max_length=255)
    temperatura_almacenamiento_c: Optional[float] = None
    humedad_relativa: Optional[float] = Field(None, ge=0, le=100)
    # ✓ Sin fotos, sin fecha_vencimiento
```

#### LoteSemillasResponse
```python
class LoteSemillasResponse(LoteSemillasBase):
    """Response schema for lote semillas"""
    id: int
    usuario_id: int
    variedad_id: int
    fecha_adquisicion: Optional[datetime]
    anos_viabilidad_semilla: Optional[int]  # ← Va aquí, no fecha_vencimiento
    lugar_almacenamiento: Optional[str]
    temperatura_almacenamiento_c: Optional[float]
    humedad_relativa: Optional[float]
    estado: str
    cantidad_restante: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    
    variedad: Optional[VariedadResponse] = None  # ← Las fotos están en variedad
    
    class Config:
        from_attributes = True
```

### 2. **routes/seeds.py** - Actualizar lógica de fotos y exportación

#### Cargar fotos en Variedad, no en Lote
**Antes:**
```python
lote.fotos = (lote.fotos or []) + new_paths
```

**Después:**
```python
lote.variedad.fotos = (lote.variedad.fotos or []) + new_paths
```

#### Eliminar fotos de Variedad
**Antes:**
```python
if not lote.fotos or photo not in lote.fotos:
    raise HTTPException(...)
lote.fotos = [p for p in lote.fotos if p != photo]
```

**Después:**
```python
if not lote.variedad.fotos or photo not in lote.variedad.fotos:
    raise HTTPException(...)
lote.variedad.fotos = [p for p in lote.variedad.fotos if p != photo]
```

#### Exportación CSV
**Antes:**
```python
lote.fecha_vencimiento.strftime('%Y-%m-%d') if lote.fecha_vencimiento else ''
```

**Después:**
```python
(datetime.now() + timedelta(days=365 * (lote.anos_viabilidad_semilla or 1))).strftime('%Y-%m-%d')
```

### 3. **ocr/vision_service.py** - Limpiar OCR extraction

- Remover `fecha_vencimiento` del diccionario de extracción
- Remover lógica de extracción de fechas de vencimiento
- Actualizar cálculo de confianza (ahora solo 3 campos core: nombre_comercial, marca, anno_produccion)

## Verificación

✅ **Backend**: Se reinició sin errores
✅ **Serialización Pydantic**: Endpoint GET /api/seeds retorna 200 OK
✅ **Estructura JSON**: 
  - `LoteSemillasResponse` contiene campos correctos
  - `VariedadResponse` contiene todos los parámetros de cultivo + fotos
  - `EspecieResponse` solo contiene info taxonómica

## Test Data Created

Para verificar que funciona:
```
Especie (ID 30): Tomate (Solanum lycopersicum)
Variedad (ID 63): Cherry con fotos y parámetros de cultivo
LoteSemillas (ID 184): Cherry Premium, 4 anos de viabilidad
```

## Impacto en la Implementación

1. **Frontend**: Los endpoints devuelven la estructura JSON correcta
2. **CSV Export**: Las fechas de vencimiento se calculan dinámicamente basadas en `anos_viabilidad_semilla`
3. **Photo Management**: Las fotos se gestionan a nivel de Variedad, no de Lote
4. **API Consistency**: Todos los endpoints ahora esperan la estructura correcta

## Próximos Pasos

1. ✓ Schema actualizado
2. ✓ Verificado que API funciona
3. ⏳ Importar datos históricos (si existen CSV con viabilidad_semilla)
4. ⏳ Verificar UI de inventario funciona correctamente

