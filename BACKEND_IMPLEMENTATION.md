# Backend Implementation - Mi Huerta y Mi Semillero

## 📋 Resumen de Implementación

Se han implementado completamente los endpoints backend para las dos nuevas funcionalidades:
- **Mi Huerta**: Gestión de plantaciones en la huerta (estados avanzados)
- **Mi Semillero**: Gestión de siembras en semillero (estados iniciales)

## 🎯 Arquitectura

Ambas funcionalidades utilizan el modelo **Plantacion** existente, diferenciándose por:
- **Estado**: Semillero usa estados iniciales (PLANIFICADA, SEMBRADA, GERMINADA), Huerta usa estados avanzados (TRASPLANTADA, CRECIMIENTO, COSECHA_CERCANA, COSECHADA)
- **tipo_siembra**: Semillero usa "semillero", Huerta usa "exterior", "terraza" o "maceta"

## 📁 Archivos Creados

### Backend API Routes

#### 1. `backend/app/api/routes/my_garden.py`
Endpoints para gestión de plantaciones en la huerta:
- `GET /api/my-garden/` - Listar plantaciones en huerta
- `POST /api/my-garden/` - Crear nueva plantación directa en huerta
- `GET /api/my-garden/{id}` - Obtener detalles de plantación
- `PUT /api/my-garden/{id}` - Actualizar plantación
- `DELETE /api/my-garden/{id}` - Eliminar plantación
- `GET /api/my-garden/stats/summary` - Estadísticas rápidas

**Filtros disponibles:**
- `status_filter`: Filtrar por estado (TRASPLANTADA, CRECIMIENTO, COSECHA_CERCANA, COSECHADA)
- `search`: Búsqueda por nombre, especie o variedad

#### 2. `backend/app/api/routes/my_seedling.py`
Endpoints para gestión de siembras en semillero:
- `GET /api/my-seedling/` - Listar siembras en semillero
- `POST /api/my-seedling/` - Crear nueva siembra desde inventario
- `GET /api/my-seedling/{id}` - Obtener detalles de siembra
- `PUT /api/my-seedling/{id}` - Actualizar siembra
- `PATCH /api/my-seedling/{id}/transplant` - Marcar como trasplantada (la mueve a huerta)
- `DELETE /api/my-seedling/{id}` - Eliminar siembra
- `GET /api/my-seedling/stats/summary` - Estadísticas rápidas

**Filtros disponibles:**
- `status_filter`: germinating (SEMBRADA), germinada (GERMINADA), ready (GERMINADA)
- `search`: Búsqueda por nombre, especie o variedad

### Frontend Updates

#### 3. `frontend/src/services/api.js`
Añadidos dos nuevos servicios:
- **myGardenAPI**: Cliente API para Mi Huerta
- **mySeedlingAPI**: Cliente API para Mi Semillero

#### 4. `frontend/src/screens/MyGarden.jsx` (actualizado)
- ✅ Conectado a API real (my-garden endpoints)
- ✅ Carga de plantaciones con filtros
- ✅ Estadísticas en tiempo real (growing, ready_to_harvest, harvested, total)
- ✅ Búsqueda y filtrado por estado
- ✅ Vista lista/cuadrícula
- ✅ Badges de estado con colores

#### 5. `frontend/src/screens/MySeedling.jsx` (actualizado)
- ✅ Conectado a API real (my-seedling endpoints)
- ✅ Carga de siembras con filtros
- ✅ Estadísticas en tiempo real (germinating, ready, transplanted, total)
- ✅ Cálculo de días desde siembra
- ✅ Búsqueda y filtrado por estado
- ✅ Badges de estado con colores

#### 6. `backend/app/main.py` (actualizado)
- ✅ Registrados routers my_garden y my_seedling

## 🔄 Flujo de Trabajo

### Opción 1: Siembra Directa en Huerta
1. Usuario crea plantación en **Mi Huerta**
2. Estado inicial: `TRASPLANTADA`
3. Puede actualizar estado a: CRECIMIENTO → COSECHA_CERCANA → COSECHADA

### Opción 2: Desde Semillero a Huerta
1. Usuario crea siembra en **Mi Semillero** desde inventario
2. Estado inicial: `SEMBRADA` (germinando)
3. Actualiza a `GERMINADA` cuando germina
4. Usa endpoint `/transplant` para trasplantar
5. Se mueve automáticamente a **Mi Huerta** con estado `TRASPLANTADA`
6. Continúa ciclo en huerta: CRECIMIENTO → COSECHA_CERCANA → COSECHADA

## 📊 Schemas Pydantic

### PlantingCreate
```python
{
    "lote_semillas_id": int,
    "nombre_plantacion": str,
    "fecha_siembra": date,
    "tipo_siembra": str,  # "exterior", "terraza", "maceta"
    "ubicacion_descripcion": str (optional),
    "cantidad_semillas_plantadas": int (optional),
    "notas": str (optional)
}
```

### SeedlingCreate
```python
{
    "lote_semillas_id": int,
    "nombre_plantacion": str,
    "fecha_siembra": date,
    "ubicacion_descripcion": str (optional),  # default: "Semillero"
    "cantidad_semillas_plantadas": int (optional),
    "notas": str (optional)
}
```

### SeedlingTransplant
```python
{
    "fecha_trasplante": date,
    "ubicacion_descripcion": str (optional)
}
```

## ✅ Estado Actual

### Completado ✅
- [x] Endpoints backend para Mi Huerta (CRUD completo)
- [x] Endpoints backend para Mi Semillero (CRUD completo + transplant)
- [x] Integración frontend con APIs
- [x] Estadísticas en tiempo real
- [x] Filtros y búsqueda
- [x] Badges de estado con colores
- [x] Cálculo de días desde siembra
- [x] Backend reiniciado y funcionando

### Pendiente ⏳
- [ ] Formularios para crear/editar plantaciones
- [ ] Páginas de detalle individual (`/my-garden/{id}`, `/my-seedling/{id}`)
- [ ] Botón de trasplante en UI de semillero
- [ ] Actualización de estados desde UI
- [ ] Gestión de fotos de plantaciones
- [ ] Integración con notificaciones (recordatorios de riego/trasplante)

## 🧪 Cómo Probar

### 1. Verificar API en Swagger
Accede a: http://localhost:8000/api/docs

Busca las secciones:
- **My Garden**: Endpoints `/api/my-garden/`
- **My Seedling**: Endpoints `/api/my-seedling/`

### 2. Crear una siembra de prueba (Postman/Swagger)
```json
POST /api/my-seedling/
{
    "lote_semillas_id": 1,
    "nombre_plantacion": "Tomates Cherry Primavera 2024",
    "fecha_siembra": "2024-03-01",
    "cantidad_semillas_plantadas": 12,
    "ubicacion_descripcion": "Semillero interior",
    "notas": "Variedad cherry, buena germinación esperada"
}
```

### 3. Verificar en Frontend
- Navega a http://localhost:3000/my-seedling
- Deberías ver la siembra creada
- Verifica las estadísticas actualizadas

### 4. Trasplantar a Huerta
```json
PATCH /api/my-seedling/{id}/transplant
{
    "fecha_trasplante": "2024-03-25",
    "ubicacion_descripcion": "Cama elevada 2, fila norte"
}
```

### 5. Verificar en Mi Huerta
- Navega a http://localhost:3000/my-garden
- La plantación trasplantada debería aparecer aquí

## 📝 Próximos Pasos Recomendados

1. **Crear formularios de alta**:
   - Modal o página para crear nueva plantación en huerta
   - Modal o página para crear nueva siembra en semillero desde inventario

2. **Páginas de detalle**:
   - Vista detallada de cada plantación con historial completo
   - Edición in-place de datos
   - Gestión de fotos

3. **Acciones rápidas**:
   - Botón "Marcar como germinada" en tarjetas de semillero
   - Botón "Trasplantar a huerta" en siembras germinadas
   - Botón "Marcar como cosechada" en plantaciones listas

4. **Integración con Calendar**:
   - Mostrar plantaciones en calendario
   - Recordatorios automáticos de trasplante
   - Alertas de cosecha próxima

5. **Dashboard/Resumen**:
   - Vista general con métricas
   - Gráficos de evolución
   - Productividad por especie

## 🔍 Documentación Técnica

### Estados del Modelo Plantacion

```python
class EstadoPlantacion(str, Enum):
    PLANIFICADA = "PLANIFICADA"          # Semillero: Planeada pero no sembrada
    SEMBRADA = "SEMBRADA"                # Semillero: Germinando
    GERMINADA = "GERMINADA"              # Semillero: Lista para trasplantar
    TRASPLANTADA = "TRASPLANTADA"        # Huerta: Recién trasplantada
    CRECIMIENTO = "CRECIMIENTO"          # Huerta: En desarrollo
    COSECHA_CERCANA = "COSECHA_CERCANA"  # Huerta: Lista para cosechar
    COSECHADA = "COSECHADA"              # Huerta: Ya cosechada
```

### Relaciones del Modelo

- `usuario_id` → users.id (propietario)
- `lote_semillas_id` → lotes_semillas.id (origen de semillas)
- Incluye joins automáticos a Variedad → Especie para datos enriquecidos

## 🚀 Servicios Activos

- **Backend**: http://localhost:8000 ✅
- **Frontend**: http://localhost:3000 ✅
- **API Docs**: http://localhost:8000/api/docs ✅
- **PostgreSQL**: localhost:5432 ✅

## 🎨 UI Features

### MyGarden (Huerta)
- Grid de estadísticas: En crecimiento, Listas para cosechar, Cosechadas, Total
- Filtros: Búsqueda por texto, filtro por estado
- Vistas: Lista o Cuadrícula
- Tarjetas con: nombre, especie, variedad, fechas, ubicación, notas, acciones

### MySeedling (Semillero)
- Grid de estadísticas: Germinando, Listas, Trasplantadas, Total
- Filtros: Búsqueda por texto, filtro por estado
- Tarjetas con: nombre, especie, variedad, fechas, días desde siembra, ubicación, notas, acciones
- Tips card con consejos de semillero

## ✅ Testing Checklist

- [x] Backend responde correctamente (200 OK)
- [x] Rutas registradas en main.py
- [x] Frontend actualizado con servicios API
- [x] Componentes conectados a API real
- [ ] Crear plantación de prueba
- [ ] Verificar filtros funcionan
- [ ] Verificar búsqueda funciona
- [ ] Probar trasplante de semillero a huerta
- [ ] Verificar estadísticas se actualizan

---

**Fecha de implementación**: 14 de febrero de 2026
**Estado**: Backend y Frontend completados ✅
**Próximo paso**: Crear formularios de alta de plantaciones
