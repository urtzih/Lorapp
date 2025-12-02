# 🌱 Lorapp - Smart Garden Management System

> **Gestión inteligente de huertas domésticas con IA, OCR, calendario agrícola y notificaciones push**

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_PWA-61DAFB?style=flat-square)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 🚀 Quick Start con Docker (Recomendado)

La forma más rápida de levantar Lorapp es con Docker:

```bash
# 1. Clonar repositorio
git clone https://github.com/tuusuario/lorapp.git
cd lorapp

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus passwords

# 3. Levantar todo el stack
docker-compose up -d

# 4. Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

**Listo en 5 minutos! 🎉**

Ver documentación completa: **[DOCKER.md](DOCKER.md)**

---

## ✨ Features

### 🤖 OCR Automático
- Escanea sobres de semillas con la cámara
- Extrae automáticamente información con Google Cloud Vision
- Nombre, variedad, fechas de caducidad, y más

### 📦 Inventario Inteligente
- Gestión completa de semillas
- Filtros por familia, marca, variedad
- Búsqueda instantánea
- Exportación a CSV

### 📅 Calendario Agrícola
- Cálculo automático de fechas de siembra
- Basado en ubicación y clima
- Recordatorios de trasplante y cosecha
- Vista mensual, por cultivo, y por tarea

### 🔔 Notificaciones Push
- Recordatorios mensuales de siembra
- Alertas de caducidad de semillas  
- Notificaciones de trasplante
- Funciona con app cerrada (PWA)

### 📱 Progressive Web App
- Instalable en móvil
- Funciona offline
- Experiencia nativa
- Soporte ES/EU (Español/Euskera)

---

## 🐳 Arquitectura Docker

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
```

**3 contenedores independientes:**
- 🐘 PostgreSQL - Base de datos persistente
- 🐍 FastAPI - Backend con OCR y notificaciones
- ⚛️ React/Nginx - Frontend PWA

---

## 📚 Documentación

- **[DOCKER.md](DOCKER.md)** - 🐳 **EMPIEZA AQUÍ** - Guía completa de Docker
- **[QUICK_START.md](QUICK_START.md)** - Setup local sin Docker
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment a Railway/Vercel
- **[walkthrough.md](walkthrough.md)** - Detalles técnicos

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Google Cloud Vision** - OCR
- **pywebpush** - Web Push notifications
- **APScheduler** - Cron jobs

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Nginx** - Production server
- **Service Worker** - PWA & Push

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Health Checks** - Container monitoring

---

## 🐳 Comandos Docker Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart backend

# Parar todo
docker-compose down

# Reconstruir imágenes
docker-compose build

# Backup de base de datos
docker-compose exec postgres pg_dump -U lorapp_user lorapp > backup.sql
```

---

## 🔧 Configuración

### Variables de Entorno Principales

```env
# Database
POSTGRES_PASSWORD=tu_password_segura

# JWT
SECRET_KEY=genera_con_openssl_rand_hex_32

# Opcional (para características avanzadas)
GOOGLE_CLIENT_ID=oauth-client-id
VAPID_PUBLIC_KEY=push-notification-key
```

Ver `.env.example` para lista completa.

---

## 🎯 Características

### ✅ Funciona sin configuración adicional
- Registro/Login con email
- Gestión de inventario
- Calendario agrícola
- Exportación CSV
- PWA instalable

### 🔧 Requiere configuración externa (opcional)
- OCR de semillas → Google Cloud Vision
- Login con Google → OAuth credentials
- Push notifications → VAPID keys

---

## 📱 PWA Features

✅ **Installable** - Add to Home Screen  
✅ **Offline-first** - Works without internet  
✅ **Push Notifications** - Background notifications  
✅ **Fast** - Service Worker caching  
✅ **Responsive** - Mobile and desktop  

---

## 🚀 Deployment

### Railway (Recomendado)

```bash
# Railway detecta automáticamente docker-compose.yml
railway up
```

### VPS Manual

```bash
# 1. Instalar Docker en servidor
curl -fsSL https://get.docker.com | sh

# 2. Clonar y configurar
git clone https://github.com/tuusuario/lorapp.git
cd lorapp
cp .env.example .env
# Editar .env

# 3. Levantar
docker-compose up -d
```

Ver **[DOCKER.md](DOCKER.md)** para deployment detallado.

---

## 🔐 Security

✅ JWT Authentication  
✅ Password hashing con bcrypt  
✅ Docker containers aislados  
✅ Environment variables para secrets  
✅ CORS protection  
✅ Health checks habilitados  

---

## 🎓 Educational Value

Proyecto completo full-stack que demuestra:

- REST API design
- Docker multi-container orchestration
- PWA implementation
- Push notifications
- OCR integration
- Background jobs
- Clean architecture

Perfecto para aprender desarrollo moderno de aplicaciones web.

---

## 🤝 Contributing

Este es un proyecto educativo. Siéntete libre de:
- Reportar bugs
- Sugerir features
- Hacer pull requests
- Mejorar documentación

---

## 📝 License

MIT License - Ver archivo [LICENSE](LICENSE)

---

## 📧 Contact

**Proyecto creado para:** Propósitos educativos  
**Repository:** https://github.com/tuusuario/lorapp

---

<div align="center">

### 🐳 Start Growing Smarter with Docker!

[Guía Docker](DOCKER.md) • [Quick Start](QUICK_START.md) • [API Docs](http://localhost:8000/api/docs)

Made with ❤️ and 🐳

</div>
