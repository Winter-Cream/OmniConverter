# OmniConverter 🚀

[![Version](https://img.shields.io/badge/version-v4.0-6366f1)](https://github.com/Winter-Cream/OmniConverter)
[![Python](https://img.shields.io/badge/python-3.9+-blue?logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

> **OmniConverter** is a modern, high-performance web and desktop application featuring multi-format file conversion, a full PDF suite, exhaustive unit converters, activity logging, and an achievement gamification system.

---

## 🌟 Key Features

### 1. 📁 File Converter
- **50+ Formats Supported**: PDF, DOCX, XLSX, PPTX, PNG, JPG, WEBP, MP3, MP4, CSV, JSON, and more.
- **Batch Processing Queue**: Drag-and-drop batch queue with real-time conversion progress indicators.
- **Watch Folder Automation Daemon (`watch_daemon.py`)**: Automatically detects and converts any new files placed in a designated input directory.

### 2. 📄 PDF Suite
- **Merge PDFs**: Combine multiple PDF documents into a single file.
- **Split & Extract**: Extract page ranges (`1-5, odd, even, all`) into single PDF or ZIP multi-page archives.
- **Compress PDF**: Downsample embedded JPEG/PNG images & optimize content streams for 80-90% file size reduction.
- **Protect & Unlock**: Encrypt PDFs with AES passwords or decrypt password-protected PDFs.
- **Rotate Pages**: Rotate document pages by 90°, 180°, or 270°.
- **Offline Client Fallback**: Client-side fallback powered by `pdf-lib` when backend is offline!

### 3. 🧮 Unit Converter
- **10-Category Multi-Unit Converter Engine**: Real-time conversions across Data Storage, Length, Weight, Speed, Temperature, Area, Volume, Time, Energy, and Pressure (100+ unit terms).

### 4. 📊 Activity Logs & Stats
- **Real-Time Analytics**: Monitor files converted, total processed bandwidth, time saved, and historical conversion logs.

### 5. 🏆 Achievements & Badges System
- **Milestone Quests**: Interactive progress bars and XP rewards for completing task milestones.
- **Dynamic Badge Unlocking**: Badges lock/unlock dynamically based on actual user actions (PDF processing, unit conversions, and file conversions).
- **Celebration Popups & Audio SFX**: Real-time toast notifications (`🏆 Badge Unlocked: [Title]!`) and audio chimes.
- **Persistent Progress**: Saved in `localStorage` (`omni_converter_state`) so all unlocked badges and quest progress persist across page reloads.

### 6. 🔍 Spotlight Quick Command Palette (`Ctrl + K`)
- Press **`Ctrl + K`** anywhere in the app to open the Spotlight search palette for instant navigation across all tools!

---

## 💻 Installation & Quick Start

### Option A: Desktop Launcher (Recommended for Windows / Linux / macOS)

#### Windows:
Double-click `run.bat` or run in terminal:
```cmd
run.bat
```

#### Linux / macOS:
```bash
chmod +x run.sh
./run.sh
```

*`run.bat` / `run.sh` will automatically create a Python virtual environment, install dependencies from `requirements.txt`, launch the FastAPI backend on `http://localhost:8500`, and open your default web browser.*

---

### Option B: Manual Server Startup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the FastAPI Uvicorn server:
   ```bash
   python server.py
   ```
3. Open `http://localhost:8500` in your web browser.

---

### Option C: Standalone Offline Mode (Zero Dependencies)
Simply double-click `omni.html` in any browser! All client-side tools (PDF operations via `pdf-lib`, Unit Converters, and Achievements) run 100% offline without needing Python installed.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla + TailwindCSS CDN), JavaScript ES6+, FontAwesome 6
- **PDF Engine**: `pypdf`, `Pillow` (Downsampling & Compression), `pdf-lib` (Browser Client Fallback)
- **Backend API**: Python 3.9+, FastAPI, Uvicorn
- **Automation Daemon**: Python `watchdog` library (`watch_daemon.py`)

---

## 📁 Repository Structure

```
a:/omniconverter/
├── omni.html              # Standalone single-page frontend application
├── server.py              # FastAPI backend REST API server
├── converter_engine.py    # Core conversion & PDF suite engine
├── watch_daemon.py        # Background Watch Folder automation daemon
├── static/
│   ├── app.js             # Master frontend JavaScript logic & solvers
│   └── style.css          # Fluid design system & glassmorphism stylesheet
├── templates/
│   └── omni.html          # Jinja2 synchronized HTML template for FastAPI
├── run.bat                # Windows desktop double-click launcher
├── run.sh                 # Linux/macOS launcher script
├── requirements.txt       # Python dependencies list
├── .gitignore             # Git ignore configuration
└── README.md              # Project documentation
```

---

## 📜 License

MIT License © 2026 Winter-Cream / OmniConverter Team.
