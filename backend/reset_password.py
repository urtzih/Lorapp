#!/usr/bin/env python3
"""
Script to reset user password for testing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password():
    """Reset user password"""
    db = SessionLocal()
    
    try:
        # Get users
        users = db.query(User).filter(User.id.in_([1, 2])).all()
        
        if not users:
            print("✗ Users not found")
            return
        
        # Set password to "test123" for all users
        for user in users:
            hashed = pwd_context.hash("test123")
            user.hashed_password = hashed
            print(f"✓ Password updated for {user.email}")
        
        db.commit()
        print(f"\n✓ Updated {len(users)} users")
        print(f"  Password: test123")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Resetting user password...")
    print("-" * 50)
    reset_password()

