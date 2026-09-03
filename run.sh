#!/bin/bash
set -e

echo "==================================================================="
echo "              OmniConverter PRO 4.1.0 Launcher                     "
echo "==================================================================="

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH."
    exit 1
fi

echo "[1/3] Installing Python dependencies..."
python3 -m pip install -q -r requirements.txt

echo "[2/3] Verifying React frontend distribution..."
if [ ! -f "frontend/dist/index.html" ]; then
    echo "Building React production bundle..."
    cd frontend
    npm install --silent
    npm run build
    cd ..
fi

echo "[3/3] Launching OmniConverter on http://localhost:8500..."
python3 server.py
