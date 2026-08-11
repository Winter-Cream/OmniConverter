#!/usr/bin/env bash
echo "==================================================================="
echo "              OmniConverter PRO 4.0 Ultra Launcher                 "
echo "==================================================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed or not in PATH."
    exit 1
fi

echo "[1/2] Checking & installing Python dependencies..."
python3 -m pip install -q -r requirements.txt

echo "[2/2] Launching OmniConverter Python Server on http://localhost:8500..."
python3 server.py
