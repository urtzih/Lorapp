"""
Main FastAPI application entry point.
Configures the app, registers routers, and initializes services.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os

from app.core.config import settings
from app.infrastructure.database.base import init_db
from app.application.services.notification_scheduler import notification_scheduler

# Import routers
from app.api.routes import auth, users, seeds, notifications, calendar


# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart garden management API with OCR seed scanning and agricultural calendar",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files (for serving uploaded images)
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Register API routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(seeds.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Run on application startup.
    Initializes database and starts notification scheduler.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database (create tables if they don't exist)
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Start notification scheduler
    try:
        notification_scheduler.start()
        logger.info("Notification scheduler started")
    except Exception as e:
        logger.error(f"Failed to start notification scheduler: {e}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown.
    Stops the notification scheduler gracefully.
    """
    logger.info("Shutting down application")
    
    try:
        notification_scheduler.stop()
        logger.info("Notification scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping notification scheduler: {e}")


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint providing API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {"status": "healthy"}


# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
