# 🐳 Lorapp - Docker Deployment Guide

Complete guide for running Lorapp with Docker and Docker Compose.

## 🎯 Why Docker?

✅ **Consistencia:** Mismo ambiente en desarrollo, testing y producción  
✅ **Simplicidad:** Un solo comando levanta todo el stack  
✅ **Aislamiento:** Cada servicio en su propio contenedor  
✅ **Escalabilidad:** Fácil de escalar horizontalmente  
✅ **Portabilidad:** Funciona en cualquier máquina con Docker  

---

## 📋 Prerequisites

- **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop)
  - Windows: Docker Desktop for Windows
  - Mac: Docker Desktop for Mac
  - Linux: Docker Engine + Docker Compose

Verificar instalación:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (3 minutos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/lorapp.git
cd lorapp
```

### 2. Configurar variables de entorno

**Para desarrollo (recomendado para empezar):**

```bash
# Usar configuración de desarrollo lista para usar
cp .env.dev .env
```

**Para producción:**

```bash
# Usar template y personalizar
cp .env.example .env
# Editar .env con tus valores (ver sección Configuración)
```

### 3. Levantar todos los servicios

```bash
docker-compose up -d
```

**Esto crea y levanta:**
- 🐘 PostgreSQL en puerto 5432
- 🐍 FastAPI Backend en puerto 8000
- ⚛️ React Frontend en puerto 3000

### 4. Verificar que todo está corriendo

```bash
docker-compose ps
```

Deberías ver 3 contenedores **healthy**:
```
NAME                STATUS
lorapp-postgres     Up (healthy)
lorapp-backend      Up (healthy)
lorapp-frontend     Up (healthy)
```

### 5. Acceder a la aplicación

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs

¡Listo! Puedes registrarte y empezar a usar la app.

---

## 📊 Arquitectura Docker

```
┌─────────────────────────────────────────┐
│   Docker Network: lorapp-network       │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  Frontend    │  │   Backend    │   │
│  │  (Nginx)     │→ │  (FastAPI)   │   │
│  │  Port: 3000  │  │  Port: 8000  │   │
│  └──────────────┘  └──────┬───────┘   │
│                            │            │
│                     ┌──────▼───────┐   │
│                     │  PostgreSQL  │   │
│                     │  Port: 5432  │   │
│                     └──────────────┘   │
└─────────────────────────────────────────┘

Volumes:
├── postgres_data (persistencia DB)
└── ./backend/uploads (fotos semillas)
```

---

## ⚙️ Configuración del .env

### Variables Esenciales

Solo necesitas cambiar estas para empezar:

```env
# Cambiar a password segura
POSTGRES_PASSWORD=tu_password_segura_aqui

# Generar con: openssl rand -hex 32
SECRET_KEY=resultado_de_openssl_rand_hex_32
```

### Variables Completas

El archivo `.env` está organizado en secciones:

#### 1️⃣ Database
```env
POSTGRES_DB=lorapp
POSTGRES_USER=lorapp_user
POSTGRES_PASSWORD=cambiar_esto
DATABASE_URL=postgresql://lorapp_user:cambiar_esto@postgres:5432/lorapp
```

#### 2️⃣ JWT Authentication
```env
SECRET_KEY=generar_con_openssl
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

#### 3️⃣ Google Cloud Vision (Opcional)
```env
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
```

#### 4️⃣ Google OAuth (Opcional)
```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

#### 5️⃣ Web Push (Opcional)
```env
VAPID_PUBLIC_KEY=generar_con_web_push
VAPID_PRIVATE_KEY=generar_con_web_push
VAPID_CLAIM_EMAIL=mailto:admin@tuapp.com
```

#### 6️⃣ CORS & URLs
```env
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
VITE_API_URL=http://localhost:8000
```

#### 7️⃣ Ports (Personalizable)
```env
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

---

## 🔧 Configuración Avanzada

### Habilitar OCR (Google Cloud Vision)

1. **Obtener credenciales:**
   - Crear proyecto en https://console.cloud.google.com
   - Habilitar Cloud Vision API
   - Crear Service Account
   - Descargar JSON key como `google-credentials.json`

2. **Colocar archivo:**
   ```bash
   # Poner google-credentials.json en backend/
   cp ~/Downloads/google-credentials.json backend/
   ```

3. **Reiniciar backend:**
   ```bash
   docker-compose restart backend
   ```

✅ Ahora puedes escanear sobres de semillas!

### Habilitar Google OAuth

1. **Obtener credenciales:**
   - Google Cloud Console → Credentials → Create OAuth Client ID
   - Authorized origins: `http://localhost:3000`

2. **Actualizar .env:**
   ```env
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu-secret
   ```

3. **Rebuild frontend:**
   ```bash
   docker-compose up -d --build frontend
   ```

### Habilitar Push Notifications

1. **Generar VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Actualizar .env:**
   ```env
   VAPID_PUBLIC_KEY=BP...
   VAPID_PRIVATE_KEY=...
   ```

3. **Rebuild:**
   ```bash
   docker-compose up -d --build
   ```

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Parar todos los servicios
docker-compose stop

# Parar y eliminar contenedores
docker-compose down

# Parar y eliminar TODO (incluye volúmenes - PIERDE DATOS)
docker-compose down -v

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir imágenes
docker-compose build

# Reconstruir y levantar
docker-compose up -d --build
```

### Acceder a contenedores

```bash
# Entrar al contenedor del backend
docker-compose exec backend bash

# Entrar a PostgreSQL
docker-compose exec postgres psql -U lorapp_user -d lorapp

# Ver logs de un contenedor
docker logs lorapp-backend

# Ver estadísticas de recursos
docker stats
```

### Database Management

```bash
# Backup de la base de datos
docker-compose exec postgres pg_dump -U lorapp_user lorapp > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U lorapp_user lorapp < backup.sql

# Conectar a la DB desde host
psql -h localhost -p 5432 -U lorapp_user -d lorapp
```

---

## 🔄 Actualizar la Aplicación

### Actualizar código sin perder datos

```bash
# 1. Bajar nuevos cambios
git pull

# 2. Reconstruir imágenes
docker-compose build

# 3. Levantar con nuevas imágenes
docker-compose up -d

# Los datos en postgres_data y uploads/ se mantienen
```

### Reset completo

```bash
# Parar todo y eliminar volúmenes (PERDERÁS DATOS)
docker-compose down -v

# Levantar desde cero
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Problema: Variables de entorno no se cargan

**Causa:** El archivo `.env` no existe o tiene formato incorrecto

**Solución:**
```bash
# Verificar que existe
ls -la .env

# Copiar desde template si no existe
cp .env.example .env

# Verificar formato (no espacios alrededor del =)
# Correcto: SECRET_KEY=valor
# Incorrecto: SECRET_KEY = valor
```

### Problema: Frontend no conecta con Backend

**Solución:** Verificar `VITE_API_URL` en `.env`

```env
# Debe apuntar a localhost:8000 para desarrollo
VITE_API_URL=http://localhost:8000
```

```bash
# Rebuild frontend para aplicar cambio
docker-compose up -d --build frontend
```

### Problema: Backend no inicia (error de base de datos)

**Solución:** Esperar a que PostgreSQL esté **healthy**

```bash
# Ver estado de salud
docker-compose ps

# Ver logs de postgres
docker-compose logs postgres

# Si persiste, recrear DB
docker-compose down -v
docker-compose up -d
```

### Problema: "Port already in use"

**Solución:** Cambiar puertos en `.env`

```env
# Cambiar a puertos libres
POSTGRES_PORT=5433
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### Problema: Contenedor se reinicia constantemente

**Solución:** Ver logs para diagnóstico

```bash
docker-compose logs backend

# Verificar health check
docker inspect lorapp-backend | grep -A 10 Health
```

---

## 🚀 Deployment a Producción

### Preparar .env para Producción

```env
# 1. Passwords fuertes
POSTGRES_PASSWORD=generar_password_muy_segura

# 2. JWT secret robusto
SECRET_KEY=resultado_de_openssl_rand_hex_32

# 3. URLs de producción
FRONTEND_URL=https://lorapp.tudominio.com
ALLOWED_ORIGINS=https://lorapp.tudominio.com
VITE_API_URL=https://api.lorapp.tudominio.com

# 4. Deshabilitar debug
DEBUG=False

# 5. APIs de producción
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
VAPID_PUBLIC_KEY=production-vapid-key
```

### Railway

```bash
# Railway detecta automáticamente docker-compose.yml
railway up

# Configurar variables en Railway UI
# Settings → Variables → copiar de .env
```

### VPS (DigitalOcean, Linode, AWS)

```bash
# 1. Conectar a VPS
ssh user@your-server.com

# 2. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 3. Crear directorio y copiar archivos
mkdir lorapp && cd lorapp

# 4. Copiar docker-compose.yml y .env
# (subir con scp o git clone)

# 5. Levantar
docker-compose up -d
```

---

## 🔐 Security Best Practices

✅ **Nunca commitear `.env`** - Está en `.gitignore`  
✅ **Passwords fuertes** - Usar generadores  
✅ **JWT secret aleatorio** - `openssl rand -hex 32`  
✅ **HTTPS en producción** - Usar reverse proxy  
✅ **Actualizar imágenes** - `docker-compose pull`  
✅ **Limitar recursos** - Ver sección siguiente  

### Resource Limits (Producción)

Añadir a `docker-compose.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

---

## 📝 Archivos del Proyecto

```
Lorapp/
├── docker-compose.yml      # Orquestación
├── .env                    # Variables (NO en git)
├── .env.example           # Template vacío
├── .env.dev               # Valores de desarrollo
├── .gitignore             # Ignora .env
├── backend/
│   ├── Dockerfile
│   ├── google-credentials.json  # NO en git
│   └── uploads/           # Volumen
└── frontend/
    ├── Dockerfile
    └── nginx.conf
```

---

## ✅ Checklist de Deployment

### Desarrollo Local (Mínimo)
- [ ] Docker Desktop instalado
- [ ] `.env` creado (`cp .env.dev .env`)
- [ ] `docker-compose up -d`
- [ ] Servicios healthy
- [ ] App accesible en http://localhost:3000

### Funcionalidades Completas
- [ ] `google-credentials.json` en `backend/`
- [ ] Google OAuth en `.env`
- [ ] VAPID keys en `.env`
- [ ] Rebuild services (`--build`)

### Producción
- [ ] Passwords fuertes en `.env`
- [ ] URLs de producción
- [ ] `DEBUG=False`
- [ ] HTTPS configurado
- [ ] Backups automatizados

---

## 🆘 Comandos de Emergencia

```bash
# Ver TODO el estado
docker-compose ps && docker-compose logs --tail=50

# Reiniciar TODO
docker-compose restart

# Logs completos
docker-compose logs > full-logs.txt

# Eliminar TODO y empezar de cero
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

**¡Listo para dockerizar! 🐳🌱**

**Quick Start:**
```bash
cp .env.dev .env
docker-compose up -d
# Abre http://localhost:3000
```
