# 🚀 Lorapp - Guía de Inicio Rápido

Esta guía te ayudará a poner en marcha Lorapp en tu máquina local en minutos.

---

## 🐳 OPCIÓN 1: Docker (Recomendado - 5 minutos)

**La forma más rápida y sencilla de empezar:**

### Requisitos

- **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop)

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/tuusuario/lorapp.git
cd lorapp

# 2. Configurar variables
cp .env.dev .env
# Opcional: editar .env si quieres personalizar

# 3. Levantar todo
docker-compose up -d

# 4. Acceder
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

**¡Listo!** Todo está corriendo (PostgreSQL + Backend + Frontend)

**Ver guía completa:** [DOCKER.md](DOCKER.md)

---

## 💻 OPCIÓN 2: Instalación Manual (Desarrollo avanzado)

Si prefieres instalar cada componente manualmente o necesitas desarrollo más profundo.

### Requisitos Previos

- **Python 3.9+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** - [Descargar](https://nodejs.org/)
- **PostgreSQL 12+** - [Descargar](https://www.postgresql.org/download/)
- **Git** - [Descargar](https://git-scm.com/)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tuusuario/lorapp.git
cd lorapp
```

### 2. Configurar PostgreSQL

**Opción A - Windows (con PostgreSQL instalado):**

```sql
-- Abre pgAdmin o psql y ejecuta:
CREATE DATABASE lorapp;
CREATE USER lorapp_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE lorapp TO lorapp_user;
```

**Opción B - Docker solo para DB:**

```bash
docker run --name lorapp-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
psql -h localhost -U postgres -c "CREATE DATABASE lorapp;"
```

### 3. Setup Backend

**Windows:**

```bash
cd backend
setup.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### 4. Configurar Variables de Entorno (Backend)

Edita `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://lorapp_user:tu_password_segura@localhost:5432/lorapp

# JWT (genera con: openssl rand -hex 32)
SECRET_KEY=GENERA_UNA_CLAVE_ALEATORIA_AQUI

# Temporales (configurar después para funcionalidades completas)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CLIENT_ID=temporal
GOOGLE_CLIENT_SECRET=temporal
VAPID_PUBLIC_KEY=temporal
VAPID_PRIVATE_KEY=temporal
```

### 5. Iniciar Backend

```bash
# Windows
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# Linux/Mac
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

✅ Backend: http://localhost:8000  
📚 API Docs: http://localhost:8000/api/docs

### 6. Setup Frontend

**Nuevo terminal:**

```bash
cd frontend
npm install
```

### 7. Configurar Variables de Entorno (Frontend)

Edita `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=temporal
VITE_GOOGLE_CLIENT_ID=temporal
```

### 8. Iniciar Frontend

```bash
npm run dev
```

✅ Frontend: http://localhost:5173

---

## 🎉 Verificar Instalación

Independientemente del método que uses:

1. **Abre la aplicación** (http://localhost:3000 con Docker, http://localhost:5173 sin Docker)
2. **Regístrate** con email y contraseña
3. **Explora** el inventario vacío
4. **Accede** al calendario y ajustes

**Funcionalidades básicas** (funcionan sin configuración):
- ✅ Registro/Login con email
- ✅ Gestión de inventario
- ✅ Calendario agrícola
- ✅ Exportación CSV

**Funcionalidades avanzadas** (requieren configuración):
- 🔧 OCR de semillas → Google Cloud Vision
- 🔧 Login con Google → OAuth
- 🔧 Notificaciones → VAPID keys

---

## 🔧 Habilitar Funcionalidades Avanzadas

### OCR (Google Cloud Vision)

1. Crear proyecto en https://console.cloud.google.com
2. Habilitar "Cloud Vision API"
3. Crear Service Account y descargar JSON
4. **Con Docker:** Colocar `google-credentials.json` en `backend/` y hacer `docker-compose restart backend`
5. **Sin Docker:** Actualizar path en `.env` y reiniciar backend

### Google OAuth

1. Google Cloud Console → OAuth 2.0 Client ID
2. **Con Docker:** Actualizar GOOGLE_CLIENT_ID en `.env` y `docker-compose up -d --build frontend`
3. **Sin Docker:** Actualizar en `backend/.env` y `frontend/.env`, reiniciar ambos

### Push Notifications

1. Generar keys: `npx web-push generate-vapid-keys`
2. **Con Docker:** Actualizar VAPID keys en `.env` y `docker-compose up -d --build`
3. **Sin Docker:** Actualizar en ambos `.env` y reiniciar

**Guías detalladas:**
- Docker: Ver [DOCKER.md](DOCKER.md)
- Manual: Ver secciones específicas abajo

---

## 🐛 Solución de Problemas

### Con Docker

```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar todo
docker-compose restart

# Empezar de cero
docker-compose down -v
docker-compose up -d
```

### Sin Docker

**Backend no inicia:**
```bash
# Verificar entorno virtual
cd backend
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**Frontend no conecta:**
- Verificar que backend esté en http://localhost:8000
- Revisar `VITE_API_URL` en `.env`

**Database error:**
- Verificar PostgreSQL corriendo
- Revisar `DATABASE_URL` en `.env`

---

## 📝 Comandos Útiles

### Docker

```bash
docker-compose up -d              # Levantar
docker-compose down               # Parar
docker-compose logs -f backend    # Ver logs
docker-compose restart backend    # Reiniciar servicio
docker-compose exec postgres psql -U lorapp_user -d lorapp  # DB
```

### Manual

```bash
# Backend
uvicorn app.main:app --reload

# Frontend
npm run dev

# Database
psql -h localhost -U lorapp_user -d lorapp
```

---

## 🎯 Próximos Pasos

1. ✅ Registra algunas semillas (manual o con OCR)
2. ✅ Explora el calendario
3. ✅ Prueba exportar a CSV
4. 🔧 Configura Google Cloud (opcional)
5. 🔧 Genera VAPID keys (opcional)
6. 🚀 Despliega en producción (ver [DEPLOYMENT.md](DEPLOYMENT.md))

---

## 📚 Más Documentación

- **[DOCKER.md](DOCKER.md)** - 🐳 Guía completa de Docker
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment a Railway/Vercel
- **[README.md](README.md)** - Overview del proyecto
- **API Docs:** http://localhost:8000/api/docs

---

## 🆘 ¿Necesitas Ayuda?

**Docker (recomendado):** Ver [DOCKER.md](DOCKER.md) - Troubleshooting completo  
**Manual:** Secciones específicas arriba  
**GitHub Issues:** Reporta problemas en el repositorio

---

**¡Feliz cultivo! 🌱**

**Quick Start:**
```bash
# Docker (más fácil)
cp .env.dev .env && docker-compose up -d

# Manual
# Ver "OPCIÓN 2" arriba
```
