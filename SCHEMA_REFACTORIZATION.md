# Refactorización del Modelo de Datos - Banco de Semillas Avanzado

## Resumen Ejecutivo

Se ha rediseñado completamente el modelo de datos de semillas para implementar un **Banco de Semillas avanzado** que separa correctamente:

1. **Entidades biológicas** (Especies y Variedades)
2. **Gestión de inventario** (Lotes de Semillas)
3. **Control de calidad** (Pruebas de Germinación)
4. **Gestión de cultivos** (Plantaciones, Cosechas, Cosechas de Semillas)

---

## Cambios Principales

### ❌ Eliminado
- **Tabla `seeds`** - Mezclaba paquete comercial, variedad biológica y seguimiento de ciclo

### ✅ Nuevas Tablas

#### **1. BOTÁNICA BASE**

##### `especies` (tabla global)
Almacena especies biológicas disponibles en la aplicación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `nombre_comun` | VARCHAR(255) | e.g., "Tomate" |
| `nombre_cientifico` | VARCHAR(255) | e.g., "Solanum lycopersicum" |
| `familia_botanica` | VARCHAR(100) | e.g., "Solanaceae" |
| `genero` | VARCHAR(100) | e.g., "Solanum" |
| `descripcion` | TEXT | Descripción botánica |
| `tipo_cultivo` | VARCHAR(50) | "hortaliza", "fruta", "flor", "aromática" |
| `profundidad_siembra_cm` | FLOAT | Estándar para la especie |
| `distancia_plantas_cm` | FLOAT | Marco de plantación estándar |
| `distancia_surcos_cm` | FLOAT | Distancia entre surcos |
| `frecuencia_riego` | ENUM | "diario", "semanal", etc. |
| `exposicion_solar` | ENUM | "total", "parcial", "sombra" |
| `dias_germinacion_min` | INT | Rango de germinación |
| `dias_germinacion_max` | INT | |
| `dias_hasta_trasplante` | INT | Ciclo recomendado |
| `dias_hasta_cosecha_min` | INT | Rango de cosecha |
| `dias_hasta_cosecha_max` | INT | |
| `meses_siembra_interior` | JSON | [1,2,3] para ene-feb-mar |
| `meses_siembra_exterior` | JSON | [4,5,6] para abr-may-jun |
| `temperatura_minima_c` | FLOAT | Rango de temperatura |
| `temperatura_maxima_c` | FLOAT | |
| `zonas_climaticas_preferidas` | JSON | ["templada", "mediterránea"] |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- 1:N con `variedades`

---

##### `variedades`
Variedades específicas dentro de cada especie.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `especie_id` | INT | FK → especies |
| `nombre_variedad` | VARCHAR(255) | e.g., "Cherry Roma" |
| `codigo_interno` | VARCHAR(100) | Código único de inventario |
| `descripcion` | TEXT | Características específicas |
| `color_fruto` | VARCHAR(100) | "rojo", "amarillo", etc. |
| `sabor` | VARCHAR(255) | Descriptores de sabor |
| `tamanio_planta` | VARCHAR(50) | "enana", "compacta", "grande" |
| `profundidad_siembra_cm` | FLOAT | Puede sobrescribir especie |
| `distancia_plantas_cm` | FLOAT | |
| `distancia_surcos_cm` | FLOAT | |
| `dias_germinacion_min` | INT | Específico de variedad |
| `dias_germinacion_max` | INT | |
| `dias_hasta_cosecha_min` | INT | |
| `dias_hasta_cosecha_max` | INT | |
| `resistencias` | JSON | ["plagas", "enfermedades"] |
| `es_hibrido_f1` | BOOLEAN | Indica si es F1 |
| `es_variedad_antigua` | BOOLEAN | Heirloom/landrace |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `especies`
- 1:N con `lotes_semillas`

---

#### **2. INVENTARIO DE SEMILLAS**

##### `lotes_semillas`
Lotes físicos de semillas que posee cada usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK → users |
| `variedad_id` | INT | FK → variedades |
| `nombre_comercial` | VARCHAR(500) | Nombre del paquete |
| `marca` | VARCHAR(255) | Marca productora |
| `numero_lote` | VARCHAR(100) | # de lote del proveedor |
| `cantidad_estimada` | INT | Semillas en paquete |
| `anno_produccion` | INT | Año de cosecha |
| `fecha_vencimiento` | DATETIME | Fecha de caducidad |
| `fecha_adquisicion` | DATETIME | Cuándo se compró |
| `lugar_almacenamiento` | VARCHAR(255) | "frigorífico", "despensa" |
| `temperatura_almacenamiento_c` | FLOAT | Temperatura de conservación |
| `humedad_relativa` | FLOAT | Humedad % |
| `estado` | ENUM | "activo", "agotado", "vencido", "descartado" |
| `cantidad_restante` | INT | Semillas disponibles |
| `fotos` | JSON | Lista de rutas de imágenes |
| `notas` | TEXT | Observaciones |
| `informacion_proveedor` | JSON | `{url, contacto}` |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `users`
- N:1 con `variedades`
- 1:N con `plantaciones`
- 1:N con `pruebas_germinacion`

---

#### **3. CONTROL DE CALIDAD**

##### `pruebas_germinacion`
Registro de pruebas de viabilidad de semillas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK → users |
| `lote_semillas_id` | INT | FK → lotes_semillas |
| `fecha_prueba` | DATETIME | Cuándo se realizó |
| `cantidad_semillas_probadas` | INT | Muestra |
| `cantidad_germinadas` | INT | Éxito |
| `porcentaje_germinacion` | FLOAT | (germinadas/probadas)*100 |
| `dias_germinacion_promedio` | FLOAT | Media de días |
| `temperatura_prueba_c` | FLOAT | Condiciones |
| `humedad_prueba_relativa` | FLOAT | Condiciones |
| `medio_germinacion` | VARCHAR(100) | "algodón", "papel", "tierra" |
| `observaciones` | TEXT | Notas de la prueba |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `users`
- N:1 con `lotes_semillas`

---

#### **4. GESTIÓN DE CULTIVOS**

##### `temporadas`
Define períodos de cultivo en el año (opcional pero recomendado).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `nombre` | VARCHAR(100) | e.g., "Primavera 2026" |
| `anno` | INT | Año |
| `mes_inicio` | INT | 1-12 |
| `mes_fin` | INT | 1-12 |
| `descripcion` | TEXT | Notas |
| `clima_esperado` | VARCHAR(100) | Predicción |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

---

##### `plantaciones`
Eventos de siembra/plantación de un lote de semillas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK → users |
| `lote_semillas_id` | INT | FK → lotes_semillas |
| `nombre_plantacion` | VARCHAR(255) | e.g., "Tomates huerto sur" |
| `fecha_siembra` | DATETIME | Cuándo se sembró |
| `tipo_siembra` | VARCHAR(50) | "interior", "exterior", "terraza", "maceta" |
| `cantidad_semillas_plantadas` | INT | Cuántas se usaron |
| `ubicacion_descripcion` | VARCHAR(255) | "huerto norte", "maceta terraza" |
| `coordenadas_x` | FLOAT | Para mapas futuros |
| `coordenadas_y` | FLOAT | |
| `estado` | ENUM | "planificada", "sembrada", "germinada", "trasplantada", "crecimiento", "cosecha_cercana", "cosechada", "cancelada" |
| `fecha_germinacion` | DATETIME | Cuándo germinó |
| `fecha_trasplante` | DATETIME | Cuándo se trasplantó |
| `fecha_cosecha_estimada` | DATETIME | Predicción |
| `fotos` | JSON | Documentación del ciclo |
| `notas` | TEXT | Observaciones |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `users`
- N:1 con `lotes_semillas`
- 1:N con `cosechas`
- 1:N con `cosechas_semillas`

---

##### `cosechas`
Eventos de cosecha de alimentos/frutos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK → users |
| `plantacion_id` | INT | FK → plantaciones |
| `fecha_cosecha` | DATETIME | Cuándo se cosechó |
| `cantidad_kg` | FLOAT | Peso total |
| `cantidad_unidades` | INT | Número de frutos/plantas |
| `descripcion` | TEXT | Detalles |
| `calidad_observada` | VARCHAR(100) | "excelente", "buena", "regular", "mala" |
| `metodo_almacenamiento` | VARCHAR(100) | Cómo se conservó |
| `fecha_consumo_inicio` | DATETIME | Cuándo se empezó a usar |
| `fotos` | JSON | Documentación |
| `notas` | TEXT | Observaciones |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `users`
- N:1 con `plantaciones`

---

##### `cosechas_semillas`
Cosechas específicas de semillas para propagación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK → users |
| `plantacion_id` | INT | FK → plantaciones |
| `fecha_cosecha` | DATETIME | Cuándo se cosecharon |
| `cantidad_semillas_estimada` | INT | Semillas obtenidas |
| `descripcion` | TEXT | Detalle del proceso |
| `metodo_secado` | VARCHAR(100) | "aire", "deshidratador" |
| `fecha_secado_completado` | DATETIME | Cuándo estuvo lista |
| `porcentaje_viabilidad_inicial` | FLOAT | Viabilidad estimada |
| `lugar_almacenamiento` | VARCHAR(255) | Dónde se guardó |
| `temperatura_almacenamiento_c` | FLOAT | Temperatura conservación |
| `humedad_relativa` | FLOAT | Humedad % |
| `fotos` | JSON | Documentación del proceso |
| `notas` | TEXT | Observaciones |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

**Relaciones:**
- N:1 con `users`
- N:1 con `plantaciones`

---

## Relaciones Completas (Grafo de Entidades)

```
usuarios
  ├── 1:N lotes_semillas
  ├── 1:N plantaciones
  ├── 1:N cosechas
  ├── 1:N cosechas_semillas
  ├── 1:N pruebas_germinacion
  └── 1:N push_subscriptions

especies (tabla global)
  └── 1:N variedades
       └── 1:N lotes_semillas
            ├── 1:N plantaciones
            │    ├── 1:N cosechas
            │    └── 1:N cosechas_semillas
            └── 1:N pruebas_germinacion
```

---

## ENUMs Definidos

### EstadoLoteSemillas
- `ACTIVO` - Disponible para usar
- `AGOTADO` - No quedan semillas
- `VENCIDO` - Pasó fecha de vencimiento
- `DESCARTADO` - Eliminado intencionalmente

### TipoExposicionSolar
- `TOTAL` - Pleno sol
- `PARCIAL` - Sombra parcial
- `SOMBRA` - Sombra completa

### FrecuenciaRiego
- `DIARIO`
- `CADA_DOS_DIAS`
- `SEMANAL`
- `CADA_DOS_SEMANAS`
- `MENSUAL`

### EstadoPlantacion
- `PLANIFICADA` - Aún no sembrada
- `SEMBRADA` - Semillas en suelo
- `GERMINADA` - Brotes visibles
- `TRASPLANTADA` - Trasplantada a ubicación final
- `CRECIMIENTO` - Crecimiento activo
- `COSECHA_CERCANA` - Próxima a cosecha
- `COSECHADA` - Cosecha realizada
- `CANCELADA` - Plantación abortada

### TipoCosecha
- `CONSUMO` - Alimento
- `SEMILLA` - Propagación
- `MIXTA` - Ambas

---

## Compatibilidad

### Mantiene
- Tabla `users` (sin cambios)
- Tabla `push_subscriptions` (renombrados campos user_id → usuario_id)
- Tabla `notification_history` (renombrados campos user_id → usuario_id)
- Tabla `crop_rules` (retrocompatibilidad)

### Todos los nombres en Castellano
- Nombres de tablas: `especies`, `variedades`, `lotes_semillas`, `plantaciones`, etc.
- Nombres de columnas: `nombre_comun`, `fecha_siembra`, `estado`, etc.
- Nombres de ENUMs: siguiendo convención snake_case en mayúsculas

---

## ENUMS en SQLAlchemy/MySQL

```python
# Para Prisma (si migraras en el futuro):
enum EstadoLoteSemillas {
  ACTIVO
  AGOTADO
  VENCIDO
  DESCARTADO
}
```

---

## Ventajas de la Nueva Estructura

### ✅ Normalización
- Datos no redundantes
- Cambios en un lugar afecta todo correctamente

### ✅ Flexibilidad
- Soporta múltiples lotes de la misma variedad
- Lotes pueden ser sembrados múltiples veces
- Múltiples cosechas por plantación

### ✅ Trazabilidad
- Cada evento tiene timestamp
- Relaciones claras entre botánica, inventario y eventos

### ✅ Escalabilidad
- Estructura lista para análisis
- Fácil agregar nuevos campos sin romper existentes
- Preparada para Prisma/Cloud migration

### ✅ Integridad
- Foreign keys con CASCADE
- ENUMs para validación de estado
- Tipos específicos evitan valores inválidos

---

## Próximos Pasos

1. **Crear migración Alembic** para SQLAlchemy
   ```bash
   alembic revision --autogenerate -m "Refactor seed bank model"
   alembic upgrade head
   ```

2. **Actualizar Schemas Pydantic** en `api/schemas.py`

3. **Actualizar rutas API** en `api/routes/`

4. **Migrar datos** desde tabla `seeds` antigua

5. **Actualizar servicios** en `application/services/`

---

## Notas de Migración

Para migrar datos de la tabla `seeds` antigua:

```sql
-- 1. Crear species/variedades desde seeds agrupando por especie
-- 2. Crear lotes_semillas desde seeds existentes
-- 3. Crear plantaciones si is_planted=true
-- 4. Crear cosechas si hay expected_harvest_date pasada
```

---

## Contacto & Soporte

Para preguntas sobre la estructura del modelo, consultar este documento.
