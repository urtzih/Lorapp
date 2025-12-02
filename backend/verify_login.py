import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Setup DB connection
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Setup bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_user(email, password):
    print(f"Checking user: {email}")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT hashed_password FROM users WHERE email = :email"), {"email": email})
        row = result.fetchone()
        
        if not row:
            print("User not found!")
            return
            
        stored_hash = row[0]
        print(f"Stored hash: {stored_hash}")
        
        is_valid = pwd_context.verify(password, stored_hash)
        print(f"Password '{password}' valid? {is_valid}")
        
        if not is_valid:
            # Try to hash the password and see what it looks like
            new_hash = pwd_context.hash(password)
            print(f"New hash for '{password}': {new_hash}")

if __name__ == "__main__":
    verify_user("test2@example.com", "password123")
