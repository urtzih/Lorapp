from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    hash = pwd_context.hash("password123")
    print(f"Hash success: {hash}")
except Exception as e:
    print(f"Hash failed: {e}")

try:
    long_pwd = "a" * 73
    hash = pwd_context.hash(long_pwd)
    print(f"Long hash success: {hash}")
except Exception as e:
    print(f"Long hash failed: {e}")
