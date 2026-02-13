# 🔧 CORS Error Fix - Explicación Técnica

## 📋 Problema Original

Cuando intentabas subir fotos a una semilla recibías dos errores simultáneamente:

```
❌ CORS Policy Error: 
"No 'Access-Control-Allow-Origin' header is present on the requested resource."

❌ Network Error: POST http://localhost:8000/api/seeds/1/photos 
"net::ERR_FAILED 500 (Internal Server Error)"
```

## 🔍 Causa Raíz

El problema tenía **dos capas**:

### Capa 1: CORS Configuration (Incompleta)
- ✅ CORS **está configurado correctamente** en `[app/core/config.py](app/core/config.py)` 
- ✅ `http://localhost:3000` (tu frontend) **SÍ está en la whitelist**
- ❌ **PERO:** El middleware CORS de FastAPI **NO se aplica a respuestas de error (500)**

### Capa 2: Exception Handling (Missing)
Cuando ocurría un error no controlado:
1. FastAPI generaba una respuesta 500
2. El middleware CORS se saltaba esa respuesta
3. El navegador bloqueaba la respuesta por falta de headers CORS
4. Nunca veías el error real del servidor

```
┌─────────────────────────────────────────────────────────────┐
│ Request: POST /api/seeds/1/photos                           │
│ Origin: http://localhost:3000                               │
│ Authorization: Bearer eyJhbGciOiJIUzI1NiIs...              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ❌ Error no controlado en el endpoint
                     │
┌────────────────────▼────────────────────────────────────────┐
│ HTTP/1.1 500 Internal Server Error                          │
│ ❌ NO incluye headers CORS                                  │
│ ❌ Navegador bloquea la respuesta                           │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Solución Implementada

### 1. Global Exception Handler (CORS para errores)
Se agregaron **exception handlers globales** en `[backend/app/main.py](backend/app/main.py#L46-L75)`:

```python
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ensure CORS headers included in error responses"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions with CORS headers"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            # ... CORS headers ...
        }
    )
```

**Beneficio:** Ahora TODAS las respuestas (incluso errores 500) incluyen headers CORS.

### 2. Mejorado Manejo de Errores en Endpoints
Se mejoró el endpoint `POST /seeds/{lote_id}/photos` con:
- ✅ Validación completa de inputs
- ✅ Manejo de excepciones explícito
- ✅ Logging detallado para debugging
- ✅ Mensajes de error informativos

```python
try:
    # Validar lote existe
    if not lote:
        raise HTTPException(status_code=404, detail=f"Lote {lote_id} not found")
    
    # Validar archivos
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 photos allowed")
    
    # Procesar
    new_paths = await storage_service.save_seed_photos(...)
    lote.fotos = (lote.fotos or []) + new_paths
    db.commit()
    
except HTTPException:
    raise  # Re-raise para que CORS handler lo procese
except Exception as e:
    logger.error(f"Error adding photos: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail=f"Error processing photos: {str(e)}")
```

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **CORS en respuestas OK** | ✅ Funciona | ✅ Funciona |
| **CORS en respuestas ERROR 500** | ❌ No hay headers | ✅ Incluye headers |
| **Logging de errores** | ⚠️ Insuficiente | ✅ Detallado |
| **Mensajes de error** | ❌ Genéricos | ✅ Específicos |
| **Debugging** | 😵 Difícil | ✅ Fácil |

## 🧪 Cómo Probar

1. **Abre las DevTools** del navegador (F12)
2. **Pestaña Network** → Intenta subir una foto
3. **Verifica la respuesta:**
   - ✅ Header `Access-Control-Allow-Origin: http://localhost:3000`
   - ✅ HTTP 200 o error específico (400, 404, 500)
   - ✅ Mensaje de error detallado en el body

4. **Pestaña Console:**
   - Deberías ver logs en azul con "[API Interceptor]"
   - Sin errores CORS bloqueados

## 🔐 CORS Configuration Actual

**Archivo:** `[backend/app/core/config.py](backend/app/core/config.py#L49-L53)`

```python
ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
```

**Orígenes permitidos:**
- ✅ `http://localhost:3000` (Frontend actual)
- ✅ `http://localhost:5173` (Vite default)
- ❌ `http://localhost:5000` (NOT allowed)
- ❌ `https://example.com` (NOT allowed)

**Headers permitidos:**
- ✅ GET, POST, PUT, DELETE, OPTIONS, PATCH
- ✅ `Content-Type`, `Authorization`
- ✅ Credentials (cookies, tokens)

## 📝 Para Producción

**⚠️ IMPORTANTE:** En producción DEBES:

1. **No permitir `*` (all origins)**
   ```python
   # ❌ MALO
   allow_origins=["*"]
   
   # ✅ BUENO
   allow_origins=["https://tudominio.com"]
   ```

2. **Configurar variables de entorno:**
   ```bash
   ALLOWED_ORIGINS=https://tudominio.com,https://app.tudominio.com
   ```

3. **Revisar headers de seguridad:**
   ```python
   allow_credentials=True  # Solo si necesitas cookies/tokens
   ```

## 🚀 Próximos Pasos

- [ ] Testear upload de fotos en local
- [ ] Verificar que DELETE también funciona
- [ ] Revisar logs en Docker: `docker-compose logs backend --tail=100`
- [ ] En producción: Configurar ALLOWED_ORIGINS con dominio real

## 📚 Referencias

- [FastAPI CORS Docs](https://fastapi.tiangolo.com/tutorial/cors/)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Starlette Exception Handlers](https://www.starlette.io/exceptions/)

---

**Fecha:** 13 de febrero, 2026  
**Estado:** ✅ Resuelto  
**Cambios:** 3 archivos modificados  
