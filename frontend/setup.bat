@echo off
REM Lorapp - Frontend Setup Script (Windows)
REM This script installs all frontend dependencies

echo.
echo 🌱 Lorapp Frontend Setup
echo ========================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

REM Check npm version
echo Checking npm version...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm not found
    pause
    exit /b 1
)
echo ✓ npm found
echo.

REM Install dependencies
echo Installing npm dependencies...
echo This may take a few minutes...
call npm install
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
    echo ⚠️  IMPORTANT: Edit .env file with:
    echo    - VITE_API_URL (backend URL)
    echo    - VITE_VAPID_PUBLIC_KEY (from backend)
    echo    - VITE_GOOGLE_CLIENT_ID (Google OAuth)
) else (
    echo ✓ .env file already exists
)
echo.

echo ✅ Frontend setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your API URL and keys
echo 2. Make sure backend is running
echo 3. Run: npm run dev
echo.
pause
