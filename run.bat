@echo off
title OmniConverter PRO 4.0 Ultra Launcher
cls
echo ===================================================================
echo               OmniConverter PRO 4.0 Ultra Launcher               
echo ===================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to system PATH.
    echo Please install Python 3.10 or higher.
    pause
    exit /b 1
)

echo [1/2] Checking and installing Python dependencies...
python -m pip install -q -r requirements.txt

echo [2/2] Launching OmniConverter Python Server on http://localhost:8500...
echo.
python server.py
pause
