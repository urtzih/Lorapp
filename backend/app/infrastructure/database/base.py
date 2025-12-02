"""
Database configuration and session management using SQLAlchemy.
Provides database engine, session factory, and base model class.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings


# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,  # Maximum number of connections to maintain
    max_overflow=20  # Maximum overflow connections
)

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that provides a database session.
    Automatically closes the session when done.
    
    Yields:
        Database session instance
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    Should be called on application startup.
    """
    # Import all models here to ensure they are registered with Base
    from app.infrastructure.database import models  # noqa
    
    Base.metadata.create_all(bind=engine)
