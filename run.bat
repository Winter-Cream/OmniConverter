@echo off
title OmniConverter PRO 4.1.0 Launcher
cls
echo ===================================================================
echo               OmniConverter PRO 4.1.0 Launcher               
echo ===================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to system PATH.
    echo Please install Python 3.10 or higher.
    pause
    exit /b 1
)

echo [1/3] Checking and installing Python dependencies...
python -m pip install -q -r requirements.txt

echo [2/3] Verifying React frontend distribution...
if not exist "frontend\dist\index.html" (
    echo Building React production bundle...
    cd frontend
    call npm install --silent
    call npm run build
    cd ..
)

echo [3/3] Launching OmniConverter on http://localhost:8500...
echo.
python server.py
pause
