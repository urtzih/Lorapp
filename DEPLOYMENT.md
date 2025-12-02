# Lorapp - Deployment Guide

Complete guide for deploying Lorapp to production environments.

---

## 🚀 Deployment Options

### **Option 1: Docker Deployment (Recommended)** 🐳

The easiest way to deploy Lorapp is using Docker. Works on Railway, any VPS, or cloud provider.

**Quick Deploy:**
```bash
# Clone and configure
git clone https://github.com/tuusuario/lorapp.git
cd lorapp
cp .env.example .env
# Edit .env with production values

# Deploy with Docker
docker-compose up -d
```

**See complete Docker deployment guide:** [DOCKER.md](DOCKER.md)

---

### **Option 2: Traditional Deployment**

Deploy backend and frontend separately to different platforms.

---

## 🐳 Docker Deployment (Detail)

### Railway (Automatic Docker Detection)

Railway automatically detects `docker-compose.yml`:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Configure in Railway UI:**
1. Project → Variables → Add all from `.env`
2. Upload `google-credentials.json` as file
3. Railway auto-deploys from `docker-compose.yml`

### VPS (DigitalOcean, Linode, AWS, etc.)

```bash
# 1. Connect to server
ssh user@your-server.com

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone and setup
git clone https://github.com/tuusuario/lorapp.git
cd lorapp
cp .env.example .env
nano .env  # Edit with production values

# 5. Deploy
docker-compose up -d

# 6. Verify
docker-compose ps
docker-compose logs -f
```

**Configure Nginx Reverse Proxy (optional):**

```nginx
server {
    listen 80;
    server_name lorapp.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

---

## 📦 Traditional Deployment (Separate Services)

### Backend Deployment

#### Railway (Python)

1. **Create Railway project**
2. **Add PostgreSQL service**
3. **Configure environment variables** from `.env.example`
4. **Deploy:**
   ```bash
   cd backend
   railway up
   ```

#### AlwaysData

1. **Setup PostgreSQL** in panel
2. **Upload backend:**
   ```bash
   scp -r backend/ user@ssh.alwaysdata.net:~/www/lorapp-api/
   ```
3. **Install dependencies:**
   ```bash
   ssh user@ssh.alwaysdata.net
   cd ~/www/lorapp-api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Configure WSGI:**
   ```python
   # passenger_wsgi.py
   import sys, os
   sys.path.insert(0, os.path.dirname(__file__))
   from app.main import app as application
   ```

### Frontend Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Set build environment variables
# VITE_API_URL, VITE_VAPID_PUBLIC_KEY, VITE_GOOGLE_CLIENT_ID

# Deploy
cd frontend
vercel --prod
```

#### Netlify

```bash
# Build frontend
cd frontend
npm install
npm run build

# Deploy dist/ folder via Netlify UI or CLI
```

---

## ⚙️ Production Configuration

### Environment Variables (.env)

**Essential changes for production:**

```env
# Strong passwords
POSTGRES_PASSWORD=use-a-very-secure-password-here

# JWT (generate with: openssl rand -hex 32)
SECRET_KEY=generate-new-secret-key-for-production

# Production URLs
FRONTEND_URL=https://lorapp.yourdomain.com
ALLOWED_ORIGINS=https://lorapp.yourdomain.com
VITE_API_URL=https://api.lorapp.yourdomain.com

# Disable debug
DEBUG=False

# Production Google credentials
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-secret

# VAPID keys (generate new for production)
VAPID_PUBLIC_KEY=production-vapid-public-key
VAPID_PRIVATE_KEY=production-vapid-private-key
```

---

## 🔐 Security Setup

### Google Cloud Vision API

1. Create project: https://console.cloud.google.com
2. Enable Cloud Vision API
3. Create Service Account → Download JSON
4. **Docker:** Place in `backend/google-credentials.json`
5. **Traditional:** Upload to server

### Google OAuth

1. Google Cloud Console → Credentials → OAuth 2.0
2. **Authorized origins:**
   ```
   https://lorapp.yourdomain.com
   https://api.lorapp.yourdomain.com
   ```
3. **Redirect URIs:**
   ```
   https://lorapp.yourdomain.com
   https://lorapp.yourdomain.com/login
   ```

### VAPID Keys (Push Notifications)

```bash
# Generate
npx web-push generate-vapid-keys

# Add to .env
VAPID_PUBLIC_KEY=BP...
VAPID_PRIVATE_KEY=...
VAPID_CLAIM_EMAIL=mailto:admin@yourapp.com
```

---

## 🔒 SSL/HTTPS

**CRITICAL:** PWA and push notifications require HTTPS!

- **Railway:** Automatic HTTPS with Let's Encrypt
- **Vercel:** Automatic HTTPS
- **VPS:** Use Certbot for Let's Encrypt

```bash
# Certbot on Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d lorapp.yourdomain.com
```

---

## ✅ Production Checklist

### Pre-Deployment
- [ ] `.env` configured with production values
- [ ] `POSTGRES_PASSWORD` is strong and unique
- [ ] `SECRET_KEY` generated with `openssl rand -hex 32`
- [ ] `DEBUG=False`
- [ ] Google Cloud Vision credentials ready
- [ ] Google OAuth configured with production URLs
- [ ] VAPID keys generated
- [ ] HTTPS certificates configured

### Post-Deployment
- [ ] Backend health check: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads correctly
- [ ] Can register/login
- [ ] PWA installs on mobile
- [ ] Push notifications work
- [ ] OCR scanning works (if configured)
- [ ] Database backups configured

---

## 📊 Monitoring

### Docker Deployment

```bash
# View logs
docker-compose logs -f

# Check health
docker-compose ps

# Resource usage
docker stats

# Database backup
docker-compose exec postgres pg_dump -U lorapp_user lorapp > backup.sql
```

### Traditional Deployment

**Railway:**
```bash
railway logs
```

**Backend health:**
```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy"}
```

---

## 🐛 Troubleshooting

### Docker Issues

See complete guide: [DOCKER.md](DOCKER.md) - Troubleshooting section

### Push Notifications Not Working

1. Must use HTTPS (not HTTP)
2. VAPID keys must match in backend & frontend
3. Not supported on Safari iOS
4. Check Service Worker: DevTools → Application

### OCR Not Working

1. Check `google-credentials.json` exists
2. Verify Cloud Vision API enabled
3. Check Google Cloud billing enabled
4. Verify image quality

### Database Connection

1. Check `DATABASE_URL` format
2. Verify database allows remote connections
3. Check firewall rules

---

## 💰 Cost Estimates

**Docker on Railway:**
- Hobby: $5/month (512MB RAM, PostgreSQL included)

**Traditional:**
- Railway Backend: $5/month
- Vercel Frontend: Free tier
- PostgreSQL: Included

**Google Cloud Vision:**
- Free: 1,000 requests/month
- After: $1.50 per 1,000

**Total:** ~$5-10/month for small-medium usage

---

## 📚 Additional Resources

- **Docker Guide:** [DOCKER.md](DOCKER.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **API Docs:** https://api.yourdomain.com/api/docs
- **Railway:** https://docs.railway.app
- **Google Cloud:** https://console.cloud.google.com

---

## 🚀 Quick Deploy Commands

**Docker (Recommended):**
```bash
git clone repo && cd lorapp
cp .env.example .env
# Edit .env
docker-compose up -d
```

**Railway:**
```bash
railway init
railway up
```

**VPS:**
```bash
# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
# Then same as Docker commands above
```

---

**Need help?** Check [DOCKER.md](DOCKER.md) for complete Docker deployment guide with troubleshooting.

**¡Deploy and grow! 🌱🚀**
