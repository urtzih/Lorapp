"""
Notification scheduler using APScheduler.
Runs periodic tasks to send push notifications based on agricultural calendar.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import User, PushSubscription, NotificationHistory
from app.application.services.calendar_service import calendar_service
from app.infrastructure.notifications.web_push_service import push_service


logger = logging.getLogger(__name__)


class NotificationScheduler:
    """
    Scheduler for automated push notifications.
    Runs cron jobs to send notifications at appropriate times.
    """
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        """
        Start the scheduler and register all cron jobs.
        """
        # Monthly planting reminder - 1st of each month at 9:00 AM
        self.scheduler.add_job(
            self.send_monthly_planting_reminders,
            trigger=CronTrigger(day=1, hour=9, minute=0),
            id="monthly_planting_reminder",
            name="Send monthly planting reminders"
        )
        
        # Seed expiration check - Daily at 10:00 AM
        self.scheduler.add_job(
            self.send_expiration_alerts,
            trigger=CronTrigger(hour=10, minute=0),
            id="expiration_alerts",
            name="Check and alert for expiring seeds"
        )
        
        # Transplant reminders - Daily at 8:00 AM
        self.scheduler.add_job(
            self.send_transplant_reminders,
            trigger=CronTrigger(hour=8, minute=0),
            id="transplant_reminders",
            name="Send transplant reminders"
        )
        
        self.scheduler.start()
        logger.info("Notification scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Notification scheduler stopped")
    
    async def send_monthly_planting_reminders(self):
        """
        Send monthly planting recommendations to all users.
        Runs on the 1st of each month.
        """
        logger.info("Running monthly planting reminder job")
        db = SessionLocal()
        
        try:
            # Get all users with notifications enabled
            users = db.query(User).filter(User.notifications_enabled == True).all()
            
            for user in users:
                # Get planting recommendations for this month
                recommendations = calendar_service.get_current_month_recommendations(user, db)
                
                if not recommendations:
                    continue  # No seeds to plant this month
                
                # Get user's push subscriptions
                subscriptions = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user.id,
                    PushSubscription.is_active == True
                ).all()
                
                if not subscriptions:
                    continue  # User has no active subscriptions
                
                # Prepare notification content
                month_name = datetime.now().strftime("%B")
                seed_list = ", ".join([r["seed_name"] for r in recommendations[:5]])
                if len(recommendations) > 5:
                    seed_list += f" y {len(recommendations) - 5} más"
                
                title = f"🌱 Siembras de {month_name}"
                body = f"Este mes puedes sembrar: {seed_list}"
                
                # Send notification
                result = push_service.send_to_user(
                    subscriptions=subscriptions,
                    title=title,
                    body=body,
                    data={"type": "monthly_planting", "recommendations": recommendations}
                )
                
                # Log notification
                self._log_notification(
                    db=db,
                    user_id=user.id,
                    notification_type="monthly_planting",
                    title=title,
                    body=body,
                    success=result["successful"] > 0
                )
                
                # Deactivate invalid subscriptions
                for sub_id in result["invalid_subscriptions"]:
                    db.query(PushSubscription).filter(PushSubscription.id == sub_id).update(
                        {"is_active": False}
                    )
            
            db.commit()
            logger.info(f"Monthly planting reminders sent to {len(users)} users")
        
        except Exception as e:
            logger.error(f"Error in monthly planting reminder job: {e}")
            db.rollback()
        
        finally:
            db.close()
    
    async def send_expiration_alerts(self):
        """
        Send alerts for seeds expiring within 30 days.
        Runs daily.
        """
        logger.info("Running expiration alerts job")
        db = SessionLocal()
        
        try:
            users = db.query(User).filter(User.notifications_enabled == True).all()
            
            for user in users:
                # Get seeds expiring in 30 days
                expiring_soon = calendar_service.get_expiring_seeds(user, days_ahead=30, db=db)
                
                # Get seeds expiring in 7 days (more urgent)
                expiring_urgent = calendar_service.get_expiring_seeds(user, days_ahead=7, db=db)
                
                if not expiring_soon:
                    continue
                
                subscriptions = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user.id,
                    PushSubscription.is_active == True
                ).all()
                
                if not subscriptions:
                    continue
                
                # Send urgent notification if seeds expiring within 7 days
                if expiring_urgent:
                    seed = expiring_urgent[0]
                    title = "⚠️ Semilla próxima a caducar"
                    body = f"{seed['seed_name']} caduca en {seed['days_until']} días"
                    
                    push_service.send_to_user(
                        subscriptions=subscriptions,
                        title=title,
                        body=body,
                        data={"type": "expiration_urgent", "seed": seed}
                    )
                    
                    self._log_notification(db, user.id, "expiration_urgent", title, body, True)
                
                # Send general reminder for seeds expiring within 30 days (once per week)
                elif len(expiring_soon) > 0 and datetime.now().weekday() == 0:  # Monday only
                    title = "📅 Semillas por caducar"
                    body = f"Tienes {len(expiring_soon)} semilla(s) que caducan pronto"
                    
                    push_service.send_to_user(
                        subscriptions=subscriptions,
                        title=title,
                        body=body,
                        data={"type": "expiration_reminder", "seeds": expiring_soon}
                    )
                    
                    self._log_notification(db, user.id, "expiration_reminder", title, body, True)
            
            db.commit()
        
        except Exception as e:
            logger.error(f"Error in expiration alerts job: {e}")
            db.rollback()
        
        finally:
            db.close()
    
    async def send_transplant_reminders(self):
        """
        Send reminders for upcoming transplants (within 3 days).
        Runs daily.
        """
        logger.info("Running transplant reminder job")
        db = SessionLocal()
        
        try:
            users = db.query(User).filter(User.notifications_enabled == True).all()
            
            for user in users:
                # Get transplants due within 3 days
                upcoming = calendar_service.get_upcoming_transplants(user, days_ahead=3, db=db)
                
                if not upcoming:
                    continue
                
                subscriptions = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user.id,
                    PushSubscription.is_active == True
                ).all()
                
                if not subscriptions:
                    continue
                
                # Send notification for each upcoming transplant
                for item in upcoming:
                    title = "🌿 Tiempo de trasplantar"
                    if item["days_until"] == 0:
                        body = f"Hoy toca trasplantar {item['seed_name']}"
                    else:
                        body = f"Trasplanta {item['seed_name']} en {item['days_until']} días"
                    
                    push_service.send_to_user(
                        subscriptions=subscriptions,
                        title=title,
                        body=body,
                        data={"type": "transplant", "seed": item}
                    )
                    
                    self._log_notification(db, user.id, "transplant", title, body, True)
            
            db.commit()
        
        except Exception as e:
            logger.error(f"Error in transplant reminder job: {e}")
            db.rollback()
        
        finally:
            db.close()
    
    def _log_notification(
        self,
        db: Session,
        user_id: int,
        notification_type: str,
        title: str,
        body: str,
        success: bool
    ):
        """Helper method to log sent notifications"""
        history = NotificationHistory(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            success=success
        )
        db.add(history)


# Global scheduler instance
notification_scheduler = NotificationScheduler()
