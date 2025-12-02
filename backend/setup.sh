#!/bin/bash

# Lorapp - Setup Script for Backend
# This script installs all backend dependencies and prepares the environment

set -e  # Exit on error

echo "🌱 Lorapp Backend Setup"
echo "======================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version found"
echo ""

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "✓ pip upgraded"
echo ""

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual credentials:"
    echo "   - DATABASE_URL"
    echo "   - SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "   - GOOGLE_APPLICATION_CREDENTIALS"
    echo "   - GOOGLE_CLIENT_ID/SECRET"
    echo "   - VAPID_PUBLIC_KEY/PRIVATE_KEY (generate with: npx web-push generate-vapid-keys)"
else
    echo "✓ .env file already exists"
fi
echo ""

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p uploads/seeds
echo "✓ Uploads directory created"
echo ""

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Setup PostgreSQL database"
echo "3. Run: uvicorn app.main:app --reload"
echo ""
