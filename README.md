<div align="center">

  <h1>⚡ OmniConverter</h1>
  <p><b>The Ultimate Universal File Converter, PDF Suite & Automation Engine</b></p>
  <p><i>A free, open-source, privacy-first conversion platform supporting 50+ formats with offline browser fallback.</i></p>

  <p>
    <a href="https://github.com/Winter-Cream/OmniConverter"><img src="https://img.shields.io/badge/version-v4.0-6366f1?style=for-the-badge&logo=rocket" alt="Version"></a>
    <a href="https://www.python.org"><img src="https://img.shields.io/badge/python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-3.0+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License"></a>
  </p>

  <p>
    <a href="#-quick-start"><b>Quick Start</b></a> •
    <a href="#-key-features"><b>Key Features</b></a> •
    <a href="#-supported-file-formats"><b>Formats Matrix</b></a> •
    <a href="#-architecture"><b>Architecture</b></a> •
    <a href="#-contributing"><b>Contributing</b></a>
  </p>

  ---
</div>

## 📖 Overview

**OmniConverter** is a state-of-the-art, high-performance web and desktop suite designed to eliminate file format restrictions, paywalls, and privacy concerns. Built with a **FastAPI backend** and a **responsive glassmorphic frontend**, OmniConverter seamlessly converts files, merges/splits/compresses PDFs, calculates unit conversions, logs activity analytics, and tracks achievements.

> 🔒 **100% Privacy-First**: Files are processed locally or on your self-hosted server with **zero data tracking** and **offline browser fallback** powered by `pdf-lib`.

---

## 🌟 Key Features

| Feature Module | Description & Capabilities |
| :--- | :--- |
| 📁 **Batch File Converter** | Convert **50+ formats** (Document, Image, Audio, Video, Data). Drag & drop queue with real-time progress indicators. |
| ⚡ **Watch Folder Daemon** | Background automation daemon (`watch_daemon.py`) that monitors local folders and instantly converts incoming files. |
| 📄 **Full PDF Suite** | **Merge**, **Split** (custom ranges & ZIP exports), **Compress** (80-90% size reduction), **Encrypt**, **Decrypt**, and **Rotate** PDFs. |
| 🌐 **Offline Client Mode** | Standalone browser execution mode using `pdf-lib` when running without a Python server backend. |
| 🧮 **Unit Converter** | **10-category engine** covering Data, Length, Weight, Speed, Temperature, Area, Volume, Time, Energy, and Pressure. |
| 📊 **Activity Analytics** | Live tracking of files processed, total bandwidth saved, conversion history logs, and time efficiency metrics. |
| 🏆 **Gamification & Badges** | Milestone quest progress bars, XP rewards, dynamic badge unlocks, audio SFX, and persistent `localStorage` saving. |
| 🔍 **Spotlight Command Palette** | Instant global search modal (`Ctrl + K`) to launch any tool in under 1 second. |

---

## 📑 Supported File Formats

OmniConverter handles a vast array of media types with automated MIME-type resolution:

```
┌─────────────────┬──────────────────────────────────────────────────────────────────┐
│ Category        │ Supported File Formats & Extensions                              │
├─────────────────┼──────────────────────────────────────────────────────────────────┤
│ 📄 Documents     │ PDF, DOCX, XLSX, PPTX, TXT, RTF, ODT, HTML                       │
│ 🖼️ Images        │ PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF, SVG                        │
│ 🎵 Audio        │ MP3, WAV, AAC, OGG, FLAC, M4A                                    │
│ 🎥 Video        │ MP4, AVI, MKV, MOV, WEBM                                         │
│ 📊 Data & Code  │ CSV, JSON, XML, YAML, TSV, SQL                                   │
└─────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 💻 Quick Start

### 🚀 Option 1: Desktop One-Click Launchers (Recommended)

#### 🪟 Windows:
Double-click `run.bat` or launch in PowerShell:
```powershell
.\run.bat
```

#### 🐧 Linux & 🍎 macOS:
```bash
chmod +x run.sh
./run.sh
```
*The launcher automatically initializes a Python virtual environment, installs dependencies, starts FastAPI on `http://localhost:8500`, and opens your default browser.*

---

### 🛠️ Option 2: Manual Terminal Startup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Winter-Cream/OmniConverter.git
   cd OmniConverter
   ```

2. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch FastAPI Server**:
   ```bash
   python server.py
   ```

4. Open `http://localhost:8500` in your web browser.

---

### 🔌 Option 3: Offline Browser Mode (Zero Dependencies)

Double-click `omni.html` directly in any web browser! All client-side tools (PDF operations via `pdf-lib`, Unit Converters, and Achievements) run **100% offline** without requiring Python.

---

## ⚡ Watch Folder Automation Daemon

Automatically convert incoming files added to a local directory:

```bash
python watch_daemon.py --input ./watch_input --output ./watch_output --target pdf
```

- **Monitors**: Incoming files in real time using `watchdog`.
- **Converts**: Automatically converts incoming documents/images to your target format.

---

## 🏗️ Architecture & Codebase

```
OmniConverter Repository
├── omni.html              # Standalone single-page frontend application
├── server.py              # FastAPI REST API server & routing
├── converter_engine.py    # Multi-format conversion & PDF processing engine
├── watch_daemon.py        # Background folder automation daemon
├── static/
│   ├── app.js             # Core JS application state & client-side solvers
│   └── style.css          # Glassmorphism design system & theme tokens
├── templates/
│   └── omni.html          # Jinja2 synchronized HTML template
├── run.bat                # Windows launcher script
└── run.sh                 # Linux/macOS launcher script
```

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create!

1. **Fork** the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

Check out our [**Contributing Guidelines**](.github/CONTRIBUTING.md) for more details.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by the Winter-Cream / OmniConverter Team</sub>
</div>
