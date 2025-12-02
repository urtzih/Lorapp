# Lorapp Backend

Backend API for Lorapp smart garden management system.

## Quick Start

### 🐳 With Docker (Recommended)

```bash
# From project root
cp .env.dev .env
docker-compose up -d
```

Backend will be available at http://localhost:8000

**API Docs:** http://localhost:8000/api/docs

---

### 💻 Manual Setup

**Prerequisites:**
- Python 3.9+
- PostgreSQL 12+
- Google Cloud Vision API credentials (optional)

**Installation:**

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and keys

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Features

- 🔐 Authentication with email/password and Google OAuth
- 📸 OCR seed packet scanning with Google Cloud Vision
- 🌱 Seed inventory management with photo uploads
- 📅 Automatic agricultural calendar based on location
- 🔔 Web Push notifications for planting reminders
- 📊 CSV export for inventory

---

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   └── security.py        # JWT & passwords
│   ├── api/
│   │   ├── dependencies.py    # Auth dependencies
│   │   ├── schemas.py         # Pydantic models
│   │   └── routes/            # API endpoints
│   ├── infrastructure/
│   │   ├── database/          # SQLAlchemy models
│   │   ├── ocr/              # Google Vision
│   │   ├── storage/          # File uploads
│   │   └── notifications/    # Web Push
│   └── application/
│       └── services/         # Business logic
├── Dockerfile                # Docker image
├── requirements.txt
└── .env.example
```

---

## Environment Variables

See `.env.example` for full list. Key variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lorapp

# JWT
SECRET_KEY=generate-with-openssl-rand-hex-32

# Google (optional for OCR/OAuth)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# Push Notifications (optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

---

## Testing

**Using Swagger UI** (easiest):
- Go to http://localhost:8000/api/docs
- Try endpoints interactively

**Using curl:**

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Scan seed (requires token)
curl -X POST http://localhost:8000/api/seeds/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@seed_packet.jpg"
```

---

## Docker

The backend includes a `Dockerfile` for containerization.

**Build:**
```bash
docker build -t lorapp-backend .
```

**Run:**
```bash
docker run -p 8000:8000 --env-file .env lorapp-backend
```

**Or use docker-compose** from project root (recommended):
```bash
docker-compose up backend
```

---

## Deployment

### With Docker

See [../DOCKER.md](../DOCKER.md) for complete Docker deployment guide.

### Traditional

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for Railway, AlwaysData, and other platforms.

---

## Development

**Run with auto-reload:**
```bash
uvicorn app.main:app --reload
```

**Change port:**
```bash
uvicorn app.main:app --port 8080
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Database

Tables are auto-created on first run via `init_db()` in `main.py`.

**Manual management with Alembic:**

```bash
# Initialize
alembic init migrations

# Create migration
alembic revision --autogenerate -m "description"

# Apply
alembic upgrade head
```

**Connect to database:**
```bash
# Docker
docker-compose exec postgres psql -U lorapp_user -d lorapp

# Local
psql -h localhost -U lorapp_user -d lorapp
```

---

## Additional Documentation

- **Main README:** [../README.md](../README.md)
- **Docker Guide:** [../DOCKER.md](../DOCKER.md)
- **Deployment:** [../DEPLOYMENT.md](../DEPLOYMENT.md)
- **Quick Start:** [../QUICK_START.md](../QUICK_START.md)

---

**Happy coding! 🌱**
