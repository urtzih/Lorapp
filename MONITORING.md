# 📊 Monitoring con Grafana + Loki + Promtail

Documentación completa del stack de monitoreo centralizado de Lorapp.

## 🚀 Acceso a Grafana

Una vez que ejecutes `docker-compose up -d`, Grafana estará disponible en:

```
🌐 http://localhost:3001
📊 Dashboard: http://localhost:3001/d/lorapp-logs/lorapp-logs-dashboard
```

### Credenciales por Defecto

```
Usuario: admin
Contraseña: admin123
```

> **⚠️ Nota de Seguridad:** Cambia la contraseña en **Administración → Usuarios** después de tu primer acceso.

---

## 📈 Componentes del Stack de Monitoreo

### 1. **Grafana** (Visualización)
- **Puerto:** 3001
- **Role:** Interfaz web para visualizar logs y métricas
- **Container:** `lorapp-grafana`
- **Features:**
  - Dashboard pre-configurado "Lorapp - Logs Dashboard"
  - Datasource Loki auto-provisionado
  - Refresh automático cada 10 segundos
  - Historial de logs últimas 24 horas

### 2. **Loki** (Log Storage)
- **Puerto:** 3100
- **Role:** Almacenamiento centralizado de logs
- **Container:** `lorapp-loki`
- **Storage:** `/tmp/loki` (dentro del contenedor)
- **Retention:** Configurable en `monitoring/loki/loki-config.yaml`

### 3. **Promtail** (Log Collector)
- **Puerto:** Ninguno (interno)
- **Role:** Colector de logs de contenedores Docker
- **Container:** `lorapp-promtail`
- **Configuración:** `monitoring/promtail/promtail-config.yaml`
- **Scrape:** Docker container logs etiquetados

---

## 📊 Dashboard Pre-Configurado

El dashboard **"Lorapp - Logs Dashboard"** incluye 8 paneles organizados en 3 secciones:

### Sección 1: Logs Generales (Fila Superior)

**Panel 1: Backend Logs**
```
Query: {container_name="lorapp-backend"}
```
Muestra logs de FastAPI en tiempo real:
- Requests entrantes GET/POST/PUT/DELETE
- Errores de autenticación
- Database connections
- Performance metrics

**Panel 2: Frontend Logs**
```
Query: {container_name="lorapp-frontend"}
```
Muestra logs del servidor Nginx:
- Page loads y assets
- 404 errors y redirects
- HTTP request status codes

**Panel 3: Database Logs**
```
Query: {container_name="lorapp-postgres"}
```
Muestra logs de PostgreSQL:
- Connection attempts
- Slow queries (> 1 segundo)
- Authentication errors
- Schema changes

**Panel 4: All Logs**
```
Query: {job="docker"}
```
Todos los logs de todos los contenedores en una sola vista para correlation análysis.

### Sección 2: Error Tracking (Fila Central - NUEVA)

**Panel 5: 🚨 Errors y Excepciones (Full Width)**
```
Query: {job="docker"} |= "ERROR" or |= "error" or |= "Exception" or |= "exception" or |= "500" or |= "CRITICAL"
```
Agrupa TODOS los errores de todos los servicios en un solo panel.
- Errores críticos resaltados
- Stack traces completos
- Status codes 500+
- Excepciones no capturadas

### Sección 3: Errores Específicos por Servicio (Fila Inferior)

**Panel 6: Backend - Errores**
```
Query: {container_name="lorapp-backend"} |= "ERROR" or |= "error" or |= "Exception"
```

**Panel 7: Frontend - Errores**
```
Query: {container_name="lorapp-frontend"} |= "ERROR" or |= "error" or |= "Exception"
```

---

## �️ Configurar Logging en los Servicios

### Backend (FastAPI) - Escribir logs a archivo

Edita `backend/app/main.py` para configurar logging a archivo:

```python
import logging
from logging.handlers import RotatingFileHandler
import os

# Crear directorio de logs si no existe
log_dir = os.getenv('LOG_DIR', '/var/log/backend')
os.makedirs(log_dir, exist_ok=True)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{log_dir}/app.log'),
        logging.StreamHandler()  # También a console
    ]
)

logger = logging.getLogger(__name__)
logger.info("Backend started successfully on 0.0.0.0:8000")
```

Luego en `docker-compose.yml`, el backend ya tiene montado:
```yaml
volumes:
  - ./logs/backend:/var/log/backend
```

### Frontend (Nginx) - Logs automáticos

Nginx escribe logs automáticamente en stdout/stderr. Para logs a archivo adicionales, edita `frontend/nginx.conf`:

```nginx
error_log /var/log/frontend/error.log warn;
access_log /var/log/frontend/access.log combined;
```

Luego monta el volumen en `docker-compose.yml`:
```yaml
volumes:
  - ./logs/frontend:/var/log/frontend
```

### Database (PostgreSQL) - Logs activados

PostgreSQL requiere configuración en el `docker-compose.yml`:

```yaml
postgres:
  environment:
    POSTGRES_INITDB_ARGS: "-c log_statement=all -c log_duration=on"
  volumes:
    - ./logs/postgres:/var/log/postgresql
```

---

### ❌ Grafana no muestra logs

1. Verifica que Loki esté corriendo:
```bash
docker ps | findstr lorapp-loki
```

2. Verifica la conexión de Loki desde Grafana:
   - Ve a **Connections → Data Sources** en Grafana UI
   - Haz click en **"Loki"**
   - Presiona **"Test"**
   - Deberías ver "Data source successfully connected"

### ❌ Los logs del backend no aparecen

1. Asegúrate de que el backend está generando logs:
```bash
docker logs lorapp-backend | tail -20
```

2. Verifica que el contenedor tiene la etiqueta `container_name`:
```bash
docker ps | findstr lorapp-backend
```

### ❌ Loki no inicia

Revisa los logs:
```bash
docker logs lorapp-loki
```

Errores comunes:
- Permisos de escritura en `/tmp/loki` - Se configura automáticamente con `user: root`
- Puertos en uso - Cambia puerto en `docker-compose.yml`

---

## 🛠️ Actualizar Configuración

### Cambiar Periodo de Retención de Logs

Edita `monitoring/loki/loki-config.yaml`:

```yaml
limits_config:
  retention_period: 720h  # Cambiar de 24h a 30 días (720 horas)
  max_cache_freshness_per_query: 10m
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 720h
```

Luego reinicia Loki:
```bash
docker-compose restart loki
```

### Agregar Nuevas Queries al Dashboard

1. En Grafana, abre el dashboard "Lorapp - Logs Dashboard"
2. Click en **"Edit"** (ícono de lápiz)
3. Click en **"Add Panel"** 
4. Configure la query LogQL:

Ejemplos útiles:
```logql
# Solo errores del backend
{container_name="lorapp-backend"} |= "ERROR"

# Login requests
{container_name="lorapp-backend"} |= "login"

# Database slow queries
{container_name="lorapp-postgres"} |= "slow"

# All 500 errors
{job="docker"} |= "500"
```

5. Guarda los cambios con **"Save"** en la esquina superior derecha

---

## 📚 LogQL Queries - Guía Rápida

### Filtros por Etiqueta
```logql
# Logs del backend
{container_name="lorapp-backend"}

# Logs con múltiples etiquetas
{container_name="lorapp-backend", code="200"}
```

### Filtros por Contenido
```logql
# Contiene "error"
{container_name="lorapp-backend"} |= "error"

# No contiene "success"
{container_name="lorapp-backend"} != "success"

# Regex matching
{container_name="lorapp-backend"} |~ "GET /api/.*"
```

### Parsers de Línea
```logql
# Extraer JSON fields
{container_name="lorapp-backend"} | json | user="user"

# Extraer campos custom
{container_name="lorapp-backend"} | regexp "(?P<method>\w+) (?P<path>/.*)"
```

### Aggregations
```logql
# Contar logs por minuto
rate({container_name="lorapp-backend"}[5m])

# Logs únicos
count_over_time({container_name="lorapp-backend"}[5m])
```

---

## 🔐 Security & Backups

### Cambiar Contraseña Admin

Dentro del contenedor:
```bash
docker exec lorapp-grafana grafana-cli admin reset-admin-password nuevacontraseña
```

### Backup de Dashboards

Los dashboards se guardan automáticamente en persistente `grafana_data/`.

Para backup manual:
```bash
docker-compose exec grafana grafana-cli admin export-dashboard > dashboard-backup.json
```

### Limpiar Logs Antiguos

Loki elimina automáticamente logs según `retention_period`.

Para forzar limpieza manualmente:
```bash
docker-compose exec loki curl -X POST -H "Content-Type: application/json" \
  http://localhost:3100/api/v1/delete \
  -d '{"query":"{container_name=\"lorapp-backend\"}", "start":"0", "end":"1000000"}'
```

---

## 📖 Referencias

- **Grafana Docs:** https://grafana.com/docs/
- **Loki Documentation:** https://grafana.com/docs/loki/latest/
- **LogQL Guide:** https://grafana.com/docs/loki/latest/logql/
- **Promtail Config:** https://grafana.com/docs/loki/latest/clients/promtail/configuration/

---

## ✅ Checklist de Salud

Verifica regularmente que todo está funcionando:

- [ ] `docker ps` muestra 5 contenedores corriendo
- [ ] Grafana accesible en http://localhost:3001
- [ ] Dashboard carga logs en tiempo real
- [ ] Loki datasource conectado (verde en Grafana UI)
- [ ] Backend logs aparecen en el panel Backend
- [ ] Frontend logs aparecen en el panel Frontend
- [ ] Database logs aparecen en el panel Database

---

## 🚨 Performance Tips

Para mejor performance con muchos logs:

1. **Limita la ventana de tiempo** en Grafana (no des últimas 24h siempre)
2. **Usa queries más específicas** - menos datos = más rápido
3. **Aumenta el batch size** en Promtail si tienes muchos contenedores
4. **Archive logs viejos** a Loki S3 para almacenamiento persistente (enterprise feature)

---

**Última actualización:** Febrero 2026
