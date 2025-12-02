"""
Push notification subscription and management API routes.
Handles Web Push subscription registration, unsubscription, and testing.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.schemas import (
    PushSubscriptionCreate, PushSubscriptionResponse,
    NotificationPayload, MessageResponse
)
from app.api.dependencies import get_current_user, get_db
from app.infrastructure.database.models import User, PushSubscription
from app.infrastructure.notifications.web_push_service import push_service


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/subscribe", response_model=PushSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_push(
    subscription_data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a new push notification subscription.
    
    - **endpoint**: Push notification endpoint URL from browser
    - **expiration_time**: Optional expiration time
    - **keys**: Object with 'p256dh' and 'auth' encryption keys
    
    Called when user grants notification permission in the browser.
    """
    # Check if subscription already exists
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == subscription_data.endpoint
    ).first()
    
    if existing:
        # Update existing subscription
        existing.user_id = current_user.id
        existing.expiration_time = subscription_data.expiration_time
        existing.p256dh = subscription_data.keys["p256dh"]
        existing.auth = subscription_data.keys["auth"]
        existing.is_active = True
        
        db.commit()
        db.refresh(existing)
        
        return PushSubscriptionResponse.from_orm(existing)
    
    # Create new subscription
    new_subscription = PushSubscription(
        user_id=current_user.id,
        endpoint=subscription_data.endpoint,
        expiration_time=subscription_data.expiration_time,
        p256dh=subscription_data.keys["p256dh"],
        auth=subscription_data.keys["auth"]
    )
    
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    
    return PushSubscriptionResponse.from_orm(new_subscription)


@router.delete("/unsubscribe", response_model=MessageResponse)
async def unsubscribe_from_push(
    endpoint: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unsubscribe from push notifications.
    
    - **endpoint**: Push notification endpoint to unsubscribe
    
    Called when user revokes notification permission.
    """
    subscription = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint,
        PushSubscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Mark as inactive instead of deleting
    subscription.is_active = False
    db.commit()
    
    return MessageResponse(message="Successfully unsubscribed from notifications")


@router.post("/test", response_model=MessageResponse)
async def send_test_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a test push notification to the user.
    
    Used to verify that push notifications are working correctly.
    """
    # Get user's active subscriptions
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.is_active == True
    ).all()
    
    if not subscriptions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active push subscriptions found. Please enable notifications first."
        )
    
    # Send test notification
    result = push_service.send_to_user(
        subscriptions=subscriptions,
        title="🌱 Lorapp - Prueba de notificación",
        body="Las notificaciones funcionan correctamente ✅",
        data={"type": "test", "timestamp": datetime.now().isoformat()}
    )
    
    # Deactivate invalid subscriptions
    for sub_id in result["invalid_subscriptions"]:
        db.query(PushSubscription).filter(PushSubscription.id == sub_id).update(
            {"is_active": False}
        )
    db.commit()
    
    if result["successful"] == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send notification. Check your subscription."
        )
    
    return MessageResponse(
        message=f"Test notification sent successfully to {result['successful']} device(s)"
    )


@router.get("/subscriptions", response_model=list[PushSubscriptionResponse])
async def get_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all push notification subscriptions for the current user.
    
    Returns list of active and inactive subscriptions.
    """
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).all()
    
    return [PushSubscriptionResponse.from_orm(sub) for sub in subscriptions]
