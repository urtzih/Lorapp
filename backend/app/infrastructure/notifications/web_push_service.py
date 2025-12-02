"""
Web Push notification service using pywebpush.
Handles push subscription management and notification delivery.
"""

from typing import Dict, Any, Optional
from pywebpush import webpush, WebPushException
import json

from app.core.config import settings
from app.infrastructure.database.models import PushSubscription


class WebPushService:
    """
    Service for sending Web Push notifications to subscribed users.
    Uses VAPID authentication for secure delivery.
    """
    
    def __init__(self):
        self.vapid_private_key = settings.VAPID_PRIVATE_KEY
        self.vapid_claims = {
            "sub": settings.VAPID_CLAIM_EMAIL
        }
    
    def send_notification(
        self,
        subscription: PushSubscription,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        icon: str = "/icons/icon-192x192.png",
        badge: str = "/icons/badge-96x96.png"
    ) -> tuple[bool, Optional[str]]:
        """
        Send a push notification to a single subscription.
        
        Args:
            subscription: PushSubscription database object
            title: Notification title
            body: Notification body text
            data: Optional additional data payload
            icon: Notification icon URL
            badge: Notification badge URL
            
        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        # Prepare notification payload
        payload = {
            "title": title,
            "body": body,
            "icon": icon,
            "badge": badge,
            "data": data or {}
        }
        
        # Prepare subscription info for pywebpush
        subscription_info = {
            "endpoint": subscription.endpoint,
            "keys": {
                "p256dh": subscription.p256dh,
                "auth": subscription.auth
            }
        }
        
        try:
            # Send push notification
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            return True, None
        
        except WebPushException as e:
            error_message = str(e)
            
            # Check if subscription is no longer valid (410 Gone or 404 Not Found)
            if e.response and e.response.status_code in [404, 410]:
                # Subscription is invalid, should be removed
                return False, f"Invalid subscription: {error_message}"
            
            # Other error
            return False, error_message
        
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
    
    def send_to_user(
        self,
        subscriptions: list[PushSubscription],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send notification to all active subscriptions for a user.
        
        Args:
            subscriptions: List of user's push subscriptions
            title: Notification title
            body: Notification body
            data: Optional payload data
            
        Returns:
            Dictionary with delivery statistics
        """
        results = {
            "total": len(subscriptions),
            "successful": 0,
            "failed": 0,
            "invalid_subscriptions": []
        }
        
        for subscription in subscriptions:
            if not subscription.is_active:
                continue
            
            success, error = self.send_notification(
                subscription=subscription,
                title=title,
                body=body,
                data=data
            )
            
            if success:
                results["successful"] += 1
            else:
                results["failed"] += 1
                
                # Mark as invalid if subscription no longer exists
                if error and "Invalid subscription" in error:
                    results["invalid_subscriptions"].append(subscription.id)
        
        return results


# Global web push service instance
push_service = WebPushService()
