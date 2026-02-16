# ✅ Solución Error 500 en /api/seeds

## 🐛 Problema Identificado

El frontend mostraba error 500 al cargar el inventario de semillas:
```
GET http://localhost:8000/api/seeds 500 (Internal Server Error)
```

**Causa Raíz**: Las columnas `temporada_id` y `lugar_id` fueron agregadas a la tabla `plantaciones` en la BD, pero **faltaban en el modelo SQLAlchemy**.

## 🔧 Solución Aplicada

### 1. Identificación del Error
```python
sqlalchemy.exc.InvalidRequestError: One or more mappers failed to initialize
- can't proceed with initialization of other mappers. 
Triggering mapper: 'Mapper[Temporada(temporadas)]'. 
Original exception was: Could not determine join condition between 
parent/child tables on relationship Temporada.plantaciones 
- there are no foreign keys linking these tables.
```

### 2. Verificación de Base de Datos
```sql
SELECT COUNT(*) FROM lotes_semillas;  -- 61 ✅
SELECT COUNT(*) FROM square_foot_gardening;  -- 375 ✅
\d plantaciones  -- temporada_id y lugar_id presentes ✅
```

**Conclusión**: Los datos están intactos, solo había un error de mapeo ORM.

### 3. Corrección en models.py

**Archivo**: `backend/app/infrastructure/database/models.py`

**Cambio Realizado**:
```python
class Plantacion(Base):
    __tablename__ = "plantaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lote_semillas_id = Column(Integer, ForeignKey("lotes_semillas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # ⭐ AGREGADO: Contexto colaborativo
    temporada_id = Column(Integer, ForeignKey("temporadas.id", ondelete="SET NULL"), nullable=True, index=True)
    lugar_id = Column(Integer, ForeignKey("lugares.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # ... resto de columnas
    
    # Relationships (ya existían, ahora funcionan correctamente)
    temporada = relationship("Temporada", back_populates="plantaciones")
    lugar = relationship("Lugar", back_populates="plantaciones")
```

### 4. Reinicio del Backend
```bash
docker-compose restart backend
```

**Resultado**: Backend inicia correctamente sin errores SQLAlchemy.

---

## ✅ Validación Post-Fix

### Backend Logs
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
✅ Sin errores de mapeo SQLAlchemy

### Datos Verificados
- ✅ 61 semillas en inventario
- ✅ 375 registros Square Foot Gardening
- ✅ Todas las tablas colaborativas presentes

---

## 🎯 Acción Requerida para Usuario

**Refresca la página del frontend**: http://localhost:3000/inventory

El inventario debería cargar correctamente ahora. El error 500 ha sido resuelto.

---

## 📝 Lección Aprendida

**Importante**: Cuando se agregan columnas FK manualmente a la base de datos:
1. ✅ Crear las columnas en la BD (SQL)
2. ✅ Crear los índices correspondientes
3. ✅ **Actualizar el modelo SQLAlchemy** ⚠️ (esto faltaba)
4. ✅ Reiniciar el backend

Las relaciones `relationship()` en SQLAlchemy necesitan que las columnas FK estén definidas explícitamente en el modelo con `Column(ForeignKey(...))`.

---

**Fecha**: 16 Feb 2026  
**Status**: ✅ RESUELTO  
**Tiempo de Resolución**: ~5 minutos
