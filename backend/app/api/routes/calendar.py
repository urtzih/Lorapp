"""
Calendar API routes.
Provides agricultural calendar views and task management.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime

from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User
from app.application.services.calendar_service import calendar_service


router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"status": "OK", "message": "Calendar router works"}


@router.get("/monthly-no-deps")
async def get_monthly_calendar_no_deps(
    month: int = Query(..., ge=1, le=12, description="Month number (1-12)"),
    year: int = Query(..., ge=2020, le=2100, description="Year")
):
    """SIMPLIFIED VERSION WITH NO DEPENDENCIES"""
    return {
        "month": month,
        "year": year,
        "test": "This works without dependencies"
    }


@router.get("/monthly")
async def get_monthly_calendar(
    month: int = Query(..., ge=1, le=12, description="Month number (1-12)"),
    year: int = Query(..., ge=2020, le=2100, description="Year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get agricultural calendar for a specific month.
    
    - **month**: Month number (1-12)
    - **year**: Year
    
    Returns all planting, transplanting, and harvesting tasks for the month,
    plus lunar phase information and planting recommendations.
    """
    tasks = calendar_service.get_monthly_tasks(
        user=current_user,
        month=month,
        year=year,
        db=db
    )
    
    # Get lunar information
    lunar_info = calendar_service.get_lunar_info_for_month(month, year)
    
    return {
        "month": month,
        "year": year,
        "tasks": tasks,
        "summary": {
            "total_planting": len(tasks["planting"]),
            "total_transplanting": len(tasks["transplanting"]),
            "total_harvesting": len(tasks["harvesting"]),
            "total_reminders": len(tasks["reminders"])
        },
        "lunar": lunar_info
    }


@router.get("/current", response_model=Dict[str, Any])
async def get_current_month_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get agricultural calendar for the current month.
    
    Convenient endpoint for getting current month's tasks.
    """
    now = datetime.now()
    
    tasks = calendar_service.get_monthly_tasks(
        user=current_user,
        month=now.month,
        year=now.year,
        db=db
    )
    
    return {
        "month": now.month,
        "year": now.year,
        "tasks": tasks,
        "summary": {
            "total_planting": len(tasks["planting"]),
            "total_transplanting": len(tasks["transplanting"]),
            "total_harvesting": len(tasks["harvesting"]),
            "total_reminders": len(tasks["reminders"])
        }
    }


@router.get("/recommendations", response_model=Dict[str, Any])
async def get_planting_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get planting recommendations for the current month.
    
    Returns list of seeds that can be planted this month based on user's inventory,
    plus lunar phase recommendations.
    """
    recommendations = calendar_service.get_current_month_recommendations(
        user=current_user,
        db=db
    )
    
    # Get current lunar phase info
    now = datetime.now()
    lunar_info = calendar_service.get_lunar_info_for_month(now.month, now.year)
    
    return {
        "recommendations": recommendations,
        "lunar_phase": lunar_info,
        "total_recommendations": len(recommendations)
    }


@router.get("/upcoming-transplants", response_model=List[Dict[str, Any]])
async def get_upcoming_transplants(
    days: int = Query(7, ge=1, le=30, description="Days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get upcoming transplant tasks.
    
    - **days**: Number of days to look ahead (default: 7)
    
    Returns seeds that need to be transplanted in the specified timeframe.
    """
    transplants = calendar_service.get_upcoming_transplants(
        user=current_user,
        days_ahead=days,
        db=db
    )
    
    return transplants


@router.get("/expiring-seeds", response_model=List[Dict[str, Any]])
async def get_expiring_seeds(
    days: int = Query(30, ge=1, le=365, description="Days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get seeds expiring within specified days.
    
    - **days**: Number of days to look ahead (default: 30)
    
    Returns list of seeds approaching expiration date.
    """
    expiring = calendar_service.get_expiring_lotes(
        user=current_user,
        days_ahead=days,
        db=db
    )
    
    return expiring


@router.get("/year-summary", response_model=Dict[str, Any])
async def get_year_summary(
    year: int = Query(..., ge=2020, le=2100, description="Year"),
    pending_only: bool = Query(True, description="Only pending lots"),
    mode: str = Query("all", description="all|indoor|outdoor"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get planting summary for the year without lunar/weather dependencies.

    Returns counts of pending planting tasks per month.
    """
    summary = calendar_service.get_year_planting_summary(
        user=current_user,
        year=year,
        pending_only=pending_only,
        mode=mode,
        db=db
    )

    return {
        "year": year,
        "months": summary
    }
