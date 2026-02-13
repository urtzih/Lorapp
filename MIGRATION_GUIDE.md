# Refactorización del Modelo de Datos - Guía de Migración

## 📋 Resumen Ejecutivo

Se ha completado la **refactorización del modelo de datos de semillas** en Lorapp:

✅ **8 nuevas tablas** creadas en `models.py`  
✅ **Esquema SQL completo** generado en `DATABASE_SCHEMA.sql`  
✅ **Esquema Prisma** para futuras migraciones en `PRISMA_SCHEMA.prisma`  
✅ **Documentación completa** en `SCHEMA_REFACTORIZATION.md`  

**Cambio principal:** Eliminación de tabla monolítica `seeds` → Descomposición en 8 tablas normalizadas

---

## 🎯 Objetivos Alcanzados

| Objetivo | Estado | Detalles |
|----------|--------|----------|
| Separar entidades botánicas | ✅ | Tablas `especies` → `variedades` |
| Normalizar inventario | ✅ | Tabla `lotes_semillas` |
| Control de calidad | ✅ | Tabla `pruebas_germinacion` |
| Gestión de ciclo vital | ✅ | Tablas `plantaciones`, `cosechas`, `cosechas_semillas` |
| Nombres en castellano | ✅ | Todas las tablas y columnas renombradas |
| Preparación para Prisma | ✅ | Esquema incluido |
| Integridad referencial | ✅ | Foreign keys con CASCADE |

---

## 📁 Archivos Generados

### 1. **`models.py`** (Modificado)
- Reemplazó tabla `Seed` con 8 nuevos modelos SQLAlchemy
- Incluye 5 ENUMs para validación de estados
- Todas las relaciones con cascade deletes
- Timestamps automáticos en todas las tablas

**Tablas nuevas:**
```
Especie, Variedad, LoteSemillas, PruebaGerminacion,
Temporada, Plantacion, Cosecha, CosechaSemillas
```

### 2. **`SCHEMA_REFACTORIZATION.md`** (Documentación completa)
- Explicación de cada tabla y sus campos
- Relaciones gráficas
- Enums y sus valores
- Ventajas de la nueva estructura
- Guía de próximos pasos

### 3. **`DATABASE_SCHEMA.sql`** (DDL para MySQL)
- Script SQL completo para crear las tablas
- Índices y composiciones optimizadas
- Vistas útiles (`v_lotes_activos`, `v_plantaciones_en_curso`)
- Datos iniciales de ejemplo (3 especies comunes)

### 4. **`PRISMA_SCHEMA.prisma`** (Esquema Prisma)
- Equivalencia 1:1 con SQLAlchemy
- Enums Prisma nativos
- Mappings de campos para camelCase ↔ snake_case
- Índices y relaciones explícitas

---

## 🚀 Pasos de Migración

### **Fase 1: Preparación (Ahora)**

```bash
# 1. Hacer backup de base de datos actual
mysqldump -u root -p lorapp > lorapp_backup_2026_02_12.sql

# 2. Verificar que models.py está correcto
cd backend

# 3. Activar virtualenv (si existe)
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows
```

### **Fase 2: Crear Alembic Migration**

```bash
# 1. Crear revisión automática de Alembic
alembic revision --autogenerate -m "Refactor: implement advanced seed bank model"

# 2. Editar el archivo de migración en alembic/versions/
# Verificar que las operaciones sean correctas

# 3. Ejecutar migración
alembic upgrade head
```

### **Fase 3: Migración de Datos**

```sql
-- 1. Insertar especies desde seeds agrupadas
INSERT INTO especies (nombre_comun, nombre_cientifico, familia_botanica, tipo_cultivo)
SELECT DISTINCT 
    s.especies,
    NULL,
    NULL,
    'hortaliza'
FROM seeds s
GROUP BY s.species;

-- 2. Insertar variedades desde seeds
INSERT INTO variedades (especie_id, nombre_variedad, codigo_interno)
SELECT 
    e.id,
    s.variety,
    CONCAT(s.species, '_', s.variety)
FROM seeds s
JOIN especies e ON s.species = e.nombre_comun
WHERE s.variety IS NOT NULL;

-- 3. Insertar lotes de semillas
INSERT INTO lotes_semillas (usuario_id, variedad_id, nombre_comercial, marca, cantidad_estimada, anno_produccion, fecha_vencimiento, estado)
SELECT 
    s.user_id,
    v.id,
    s.commercial_name,
    s.brand,
    s.estimated_count,
    s.production_year,
    s.expiration_date,
    CASE 
        WHEN s.expiration_date < NOW() THEN 'vencido'
        ELSE 'activo'
    END
FROM seeds s
JOIN variedades v ON v.nombre_variedad = s.variety;

-- 4. Crear plantaciones para seeds que fueron plantadas
INSERT INTO plantaciones (usuario_id, lote_semillas_id, nombre_plantacion, fecha_siembra, tipo_siembra, estado)
SELECT 
    s.user_id,
    ls.id,
    s.commercial_name,
    s.planting_date,
    'exterior',
    'cosechada'
FROM seeds s
JOIN lotes_semillas ls ON ls.id = s.id
WHERE s.is_planted = TRUE;
```

### **Fase 4: Actualizar Código Backend**

**1. Actualizar schemas Pydantic** (`api/schemas.py`):
```python
# Antes
class SeedSchema(BaseModel):
    commercial_name: str
    species: str
    variety: str
    # ...

# Después
class LoteSemillasSchema(BaseModel):
    nombre_comercial: str
    variedad_id: int
    # ...

class EspecieSchema(BaseModel):
    nombre_comun: str
    nombre_cientifico: Optional[str]
    # ...
```

**2. Actualizar rutas API** (`api/routes/`):
```python
# Crear nuevas rutas
@router.post("/api/especies")
@router.get("/api/variedad/{variedad_id}")
@router.post("/api/lotes-semillas")
@router.post("/api/plantaciones")
@router.get("/api/plantaciones/usuario/{usuario_id}")
```

**3. Actualizar servicios** (`application/services/`):
```python
# Crear nuevos servicios
class EspecieService:
    def obtener_por_nombre(self, nombre: str)
    def crear_con_variedad(self, especie_data)

class LoteSemillasService:
    def obtener_activos_usuario(self, usuario_id)
    def verificar_vencimientos()

class PlantacionService:
    def obtener_en_curso(self, usuario_id)
    def actualizar_estado()
```

---

## 📊 Estructura de Datos - Flujo Típico

```
USUARIO
  ↓
ESPECIE (Global - "Tomate")
  ↓
VARIEDAD (Global - "Cherry Roma")
  ↓
LOTE_SEMILLAS (Usuario - "Semillas tomate cherry Roma - Marca X")
  ├→ PRUEBA_GERMINACION (Control de calidad)
  │
  └→ PLANTACION (Usuario - "Tomates en huerto sur - Primavera 2026")
      ├→ COSECHA (Producto final - alimento)
      ├→ COSECHA_SEMILLAS (Producto final - semillas para reproducción)
      │   └→ LOTE_SEMILLAS (Crear nuevo lote a partir de la cosecha)
```

---

## 🔄 Transiciones de Estado - Máquina de Estados

### `EstadoPlantacion`

```
[PLANIFICADA] → [SEMBRADA] → [GERMINADA] → [TRASPLANTADA] → [CRECIMIENTO] → [COSECHA_CERCANA] → [COSECHADA]
                                                                                      ↓
                                                                                  [CANCELADA]
```

### `EstadoLoteSemillas`

```
[ACTIVO] → [AGOTADO]  (cuando cantidad_restante = 0)
[ACTIVO] → [VENCIDO]  (cuando fecha_vencimiento < NOW())
[*] → [DESCARTADO]    (acción manual)
```

---

## 🔐 Integridad Referencial - CASCADE Deletes

```
users.id → lotes_semillas.usuario_id [CASCADE]
users.id → plantaciones.usuario_id [CASCADE]
users.id → cosechas.usuario_id [CASCADE]

variedades.id → lotes_semillas.variedad_id [CASCADE]
especies.id → variedades.especie_id [CASCADE]

lotes_semillas.id ↔ plantaciones [1:N, CASCADE]
plantaciones.id → cosechas [1:N, CASCADE]
plantaciones.id → cosechas_semillas [1:N, CASCADE]
lotes_semillas.id → pruebas_germinacion [1:N, CASCADE]
```

**Implicación:** Borrar un usuario borra TODO (lotes, plantaciones, cosechas, etc.)

---

## 📈 Índices para Optimización

### Creados automáticamente
```sql
CREATE INDEX idx_usuario_estado ON lotes_semillas(usuario_id, estado);
CREATE INDEX idx_usuario_plantacion_estado ON plantaciones(usuario_id, estado);
CREATE INDEX idx_plantacion_cosecha ON cosechas(plantacion_id, fecha_cosecha);
```

### Queries optimizadas
```sql
-- Lotes activos del usuario
SELECT * FROM lotes_semillas 
WHERE usuario_id = ? AND estado = 'activo'
-- Usa índice: idx_usuario_estado

-- Plantaciones en curso
SELECT * FROM plantaciones 
WHERE usuario_id = ? AND estado NOT IN ('cosechada', 'cancelada')
-- Usa índice: idx_usuario_plantacion_estado
```

---

## ⚠️ Cambios Críticos

### 1. Nombres de Campos Changed
```python
# Antes (English)
user_id, hashed_password, commercial_name, expiration_date
estimated_count, is_planted, planting_date, expected_harvest_date

# Después (Castellano)
usuario_id, password_hash, nombre_comercial, fecha_vencimiento
cantidad_estimada, estado, fecha_siembra, fecha_cosecha_estimada
```

### 2. Validación Énumera
```python
# No permitido
plantacion.estado = "invalid"

# Válido
plantacion.estado = EstadoPlantacion.SEMBRADA
```

### 3. Relaciones Obligatorias
```python
# Todas las semillas ahora requieren variedad_id
lote = LoteSemillas(usuario_id=1, variedad_id=5)  # ✅
lote = LoteSemillas(usuario_id=1)  # ❌ Error FK

# Variedad requiere especie
variedad = Variedad(nombre_variedad="Cherry", especie_id=1)  # ✅
```

---

## 🧪 Testing Recomendado

### Pruebas Unitarias
```python
def test_crear_lote_semillas():
    usuario = crear_usuario()
    especie = crear_especie()
    variedad = crear_variedad(especie)
    lote = crear_lote_semillas(usuario, variedad)
    
    assert lote.usuario_id == usuario.id
    assert lote.estado == EstadoLoteSemillas.ACTIVO

def test_ciclo_plantacion_completo():
    plantacion = crear_plantacion(estado=EstadoPlantacion.PLANIFICADA)
    plantacion.estado = EstadoPlantacion.SEMBRADA
    plantacion.estado = EstadoPlantacion.GERMINADA
    # ... validar transiciones
```

### Pruebas de Integridad
```python
# Verificar que no quedan huérfanos
SELECT COUNT(*) FROM lotes_semillas WHERE variedad_id NOT IN (SELECT id FROM variedades);
SELECT COUNT(*) FROM plantaciones WHERE lote_semillas_id NOT IN (SELECT id FROM lotes_semillas);
```

---

## 📝 Próximas Fases (Post-Migración)

### Fase 5: Actualizar Frontend
- Actualizar componentes React para nuevas URLs API
- Cambiar nombres de campos en formularios
- Implementar selectores de especie/variedad

### Fase 6: Vistas y Reportes
- Usar vistas creadas (v_lotes_activos, v_plantaciones_en_curso)
- Crear dashboards de seguimiento
- Exportar datos a CSV Excel

### Fase 7: Migración a Prisma (Futuro)
- Usar esquema `PRISMA_SCHEMA.prisma`
- Migrar de SQLAlchemy a Prisma gradualmente
- Actualizar seeds de testing

---

## 📞 Soporte

### Documentación Detallada
- [SCHEMA_REFACTORIZATION.md](SCHEMA_REFACTORIZATION.md) - Explicación completa
- [DATABASE_SCHEMA.sql](../backend/DATABASE_SCHEMA.sql) - SQL DDL
- [PRISMA_SCHEMA.prisma](../backend/PRISMA_SCHEMA.prisma) - Esquema Prisma

### Errores Comunes
**Error:** `ForeignKeyError: lotes_semillas.variedad_id`  
**Solución:** Asegurar que variedades existe antes de insertar lotes

**Error:** `IntegrityError: duplicate key variedad_id`  
**Solución:** Verificar índices únicos en código de migración

---

## ✅ Checklist de Migración

- [ ] Hacer backup BD `mysqldump`
- [ ] Crear rama `git checkout -b feat/seed-bank-refactor`
- [ ] Crear migración Alembic
- [ ] Ejecutar migración en dev
- [ ] Migrar datos del schema antiguo
- [ ] Actualizar todos los schemas Pydantic
- [ ] Actualizar todas las rutas API
- [ ] Actualizar servicios de lógica negativa
- [ ] Ejecutar test unitarios
- [ ] Ejecutar test de integración
- [ ] Pruebas manuales en staging
- [ ] Code review
- [ ] Merge a main
- [ ] Deploy a producción

---

**Versión:** 1.0  
**Fecha:** 12 de febrero  de 2026  
**Autor:** Refactoración automática  
**Estado:** Completado
