from app.core.security import get_password_hash
from app.infrastructure.database.models import User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = "postgresql://lorapp_user:lorapp_dev_password_123@lorapp-postgres:5432/lorapp"
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

try:
    user = session.query(User).filter(User.email == "urtzid@gmail.com").first()
    if user:
        user.hashed_password = get_password_hash("admin123")
        session.commit()
        print("OK")
    else:
        print("NOT_FOUND")
except Exception as e:
    print(f"ERROR: {e}")
    session.rollback()
finally:
    session.close()
