@echo off
REM Lorapp - Setup Script for Backend (Windows)
REM This script installs all backend dependencies and prepares the environment

echo.
echo 🌱 Lorapp Backend Setup
echo =======================
echo.

REM Check Python version
echo Checking Python version...
python --version
if errorlevel 1 (
    echo ❌ Error: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)
echo ✓ Python found
echo.

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
echo ✓ pip upgraded
echo.

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error installing dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo ✓ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your actual credentials:
    echo    - DATABASE_URL
    echo    - SECRET_KEY (generate with: openssl rand -hex 32)
    echo    - GOOGLE_APPLICATION_CREDENTIALS
    echo    - GOOGLE_CLIENT_ID/SECRET
    echo    - VAPID_PUBLIC_KEY/PRIVATE_KEY (generate with: npx web-push generate-vapid-keys)
) else (
    echo ✓ .env file already exists
)
echo.

REM Create uploads directory
echo Creating uploads directory...
if not exist "uploads\seeds" mkdir uploads\seeds
echo ✓ Uploads directory created
echo.

echo ✅ Backend setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your credentials
echo 2. Setup PostgreSQL database
echo 3. Run: uvicorn app.main:app --reload
echo.
pause
