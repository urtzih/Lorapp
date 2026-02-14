# Actualización de Navegación y Estructura - Lorapp

## Fecha: 14 de febrero de 2026

## 🎯 Cambios Realizados

### 1. **Nuevas Páginas Principales**

#### 📍 Mi Huerta (`/my-garden`) - **PÁGINA POR DEFECTO**
- **Propósito**: Registro y seguimiento de plantaciones en la huerta
- **Funcionalidades diseñadas**:
  - Registro de fechas de siembra
  - Fecha de trasplante
  - Ubicación en la huerta
  - Cantidad plantada
  - Fecha de cosecha
  - Notas y observaciones
  - Estados: Plantado, En crecimiento, Cosechado
- **Vista**: Lista o cuadrícula
- **Estado**: Frontend implementado, backend pendiente

#### 🌾 Mi Semillero (`/my-seedling`)
- **Propósito**: Registro de siembras desde el inventario
- **Funcionalidades diseñadas**:
  - Registro de semillas sembradas del inventario
  - Seguimiento desde germinación hasta trasplante
  - Estados: Germinando, Listas para trasplantar, Trasplantadas
  - Estadísticas rápidas (contadores por estado)
- **Vista**: Cuadrícula
- **Estado**: Frontend implementado, backend pendiente
- **Conexión**: Vinculado al inventario de semillas

### 2. **Reorganización de Navegación**

#### Estructura Anterior:
```
- Inventario
- Plantación
- Calendario
- Ajustes
```

#### Estructura Nueva:
```
- Mi Huerta (PÁGINA POR DEFECTO) ⭐
- Mi Semillero
- Inventario
- Guía SFG
- Calendario
- Ajustes
```

#### Cambios en Rutas:
- `/` → Redirige a `/my-garden` (antes iba a `/inventory`)
- `/my-garden` → Nueva página Mi Huerta
- `/my-seedling` → Nueva página Mi Semillero
- `/planting` → Renombrado a "Guía SFG" (antes "Plantación")
- Resto de rutas sin cambios

### 3. **Corrección de Márgenes**

Se añadió padding y márgenes consistentes a todas las páginas:

```jsx
<div className="container" style={{ 
  padding: 'var(--space-4)', 
  maxWidth: '1200px', 
  margin: '0 auto',
  paddingBottom: '100px' // Para navegación móvil
}}>
```

**Páginas actualizadas:**
- ✅ Mi Huerta (nueva)
- ✅ Mi Semillero (nueva)
- ✅ Planting/Guía SFG
- ✅ Calendar
- ✅ Settings

### 4. **Nuevos Iconos en Navegación**

```jsx
garden: 🎯 (Ubicación/jardín)
seedling: 🌱 (Plántula)
inventory: 📦 (Inventario)
planting: 🌿 (Guía SFG)
calendar: 📅 (Calendario)
settings: ⚙️ (Ajustes)
```

## 📁 Archivos Modificados

### Nuevos Archivos:
- `frontend/src/screens/MyGarden.jsx` (176 líneas)
- `frontend/src/screens/MySeedling.jsx` (173 líneas)

### Archivos Modificados:
- `frontend/src/screens/index.jsx` - Añadidas exportaciones
- `frontend/src/App.jsx` - Añadidas rutas y cambio de ruta por defecto
- `frontend/src/components/layout/Layout.jsx` - Actualizada navegación con 6 items
- `frontend/src/screens/Planting.jsx` - Corregidos márgenes, renombrado título
- `frontend/src/screens/Calendar.jsx` - Corregidos márgenes
- `frontend/src/screens/Settings.jsx` - Corregidos márgenes

## 🔧 Backend Pendiente

Las nuevas páginas requieren endpoints en el backend:

### Para Mi Huerta:
```python
# Crear endpoint /api/plantings/
- GET /api/plantings/ - Listar plantaciones
- POST /api/plantings/ - Crear plantación
- GET /api/plantings/{id} - Detalle de plantación
- PUT /api/plantings/{id} - Actualizar plantación
- DELETE /api/plantings/{id} - Eliminar plantación

# Schema sugerido:
class Planting:
    id: int
    usuario_id: int
    variedad_id: int
    fecha_siembra: date
    fecha_trasplante: Optional[date]
    fecha_cosecha: Optional[date]
    ubicacion: str  # "Bancal 1", "Maceta 3", etc.
    cantidad: int
    estado: str  # "planted", "growing", "harvested"
    notas: Optional[str]
```

### Para Mi Semillero:
```python
# Crear endpoint /api/seedlings/
- GET /api/seedlings/ - Listar siembras en semillero
- POST /api/seedlings/ - Registrar siembra desde inventario
- GET /api/seedlings/{id} - Detalle de siembra
- PUT /api/seedlings/{id} - Actualizar estado
- PATCH /api/seedlings/{id}/transplant - Marcar como trasplantada

# Schema sugerido:
class Seedling:
    id: int
    usuario_id: int
    lote_semilla_id: int  # Vinculado al inventario
    fecha_siembra: date
    fecha_germinacion: Optional[date]
    fecha_trasplante: Optional[date]
    ubicacion_semillero: str
    cantidad: int
    estado: str  # "germinating", "ready", "transplanted"
    notas: Optional[str]
```

## 🎨 Características de Diseño

### Mi Huerta:
- **Card de información** con gradiente púrpura
- **Lista de funcionalidades** en grid responsivo
- **Empty state** atractivo con icono grande
- **Filtros**: búsqueda + estado + vista (lista/grid)

### Mi Semillero:
- **Estadísticas rápidas** en 4 cards con iconos
- **Card de tips** con gradiente verde
- **Consejos de cultivo** en grid
- **Botón de acción** que lleva al inventario
- **Empty state** con llamada a la acción

### Ambas páginas:
- ✅ Márgenes consistentes
- ✅ Max-width 1200px centrado
- ✅ Padding responsive
- ✅ Espacio para navegación móvil
- ✅ Loading states
- ✅ Headers con título y descripción

## 📱 Navegación Móvil

El bottom navigation ahora muestra 6 items en lugar de 4:
- Puede ser necesario ajustar tamaño de texto o iconos en móvil
- Considerar scroll horizontal si hay problemas de espacio

## ✅ Estado Actual

### Completado:
- ✅ Páginas frontend creadas
- ✅ Rutas configuradas
- ✅ Navegación actualizada
- ✅ Márgenes corregidos
- ✅ Página por defecto cambiada a "Mi Huerta"
- ✅ Iconos actualizados
- ✅ Código reconstruido y desplegado

### Pendiente:
- ⏳ Endpoints backend para plantings
- ⏳ Endpoints backend para seedlings
- ⏳ Modelos SQLAlchemy
- ⏳ Schemas Pydantic
- ⏳ Migraciones Alembic
- ⏳ Pruebas funcionales

## 🚀 Próximos Pasos

1. **Crear modelos de base de datos**
   - Tabla `plantings`
   - Tabla `seedlings`

2. **Implementar endpoints backend**
   - CRUD completo para plantings
   - CRUD completo para seedlings
   - Relaciones con lotes_semillas y variedades

3. **Conectar frontend con API**
   - Implementar llamadas en `seedlingsAPI`
   - Implementar llamadas en `plantingsAPI`
   - Manejar estados de carga y errores

4. **Testing**
   - Probar flujo completo desde inventario a semillero a huerta
   - Verificar filtros y búsquedas
   - Comprobar responsive en móvil

## 📝 Notas Técnicas

- Square Foot Gardening ahora tiene su propia tabla con 3 métodos (Original, Multisiembra, Macizo)
- 16 plantas importadas con datos SFG
- Inventario de semillas funcionando (61 lotes en DB)
- Todos los contenedores reconstruidos sin caché
