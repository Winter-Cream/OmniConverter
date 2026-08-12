<div align="center">

  <h1>⚡ OmniConverter</h1>
  <p><b>The Ultimate Free, Universal File Converter, PDF Suite & Automation Engine</b></p>
  <p><i>Convert 50+ formats locally or in your browser with zero data tracking and offline client fallback.</i></p>

  <p>
    <a href="https://github.com/Winter-Cream/OmniConverter"><img src="https://img.shields.io/badge/version-v4.0-6366f1?style=for-the-badge&logo=rocket" alt="Version"></a>
    <a href="https://www.python.org"><img src="https://img.shields.io/badge/python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-3.0+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License"></a>
    <a href="https://github.com/Winter-Cream/OmniConverter/stargazers"><img src="https://img.shields.io/github/stars/Winter-Cream/OmniConverter?style=for-the-badge&color=gold" alt="GitHub Stars"></a>
  </p>

  <p>
    <a href="#-quick-start"><b>🚀 Quick Start</b></a> •
    <a href="#-key-features"><b>🌟 Key Features</b></a> •
    <a href="#-supported-file-formats"><b>📑 Formats Matrix</b></a> •
    <a href="#-omniconverter-vs-commercial-tools"><b>⚖️ Comparison</b></a> •
    <a href="#-rest-api-reference"><b>🔌 API Reference</b></a> •
    <a href="#-contributing"><b>🤝 Contributing</b></a>
  </p>

  ---
</div>

## 📖 Overview

**OmniConverter** is a state-of-the-art, privacy-first web and desktop application designed to eliminate paywalls, upload quotas, and privacy risks when converting files. Built with a high-performance **FastAPI backend**, an offline-first **`pdf-lib` browser fallback**, and a **responsive glassmorphic UI**, OmniConverter puts complete media conversion power right in your hands.

> 🔒 **100% Privacy & Zero Tracking**: Your files stay on your system. No external telemetry, no remote uploads, and zero data logging.

---

## ⚖️ OmniConverter vs Commercial Tools

| Feature | ⚡ OmniConverter | CloudConvert / Smallpdf | ILovePDF |
| :--- | :---: | :---: | :---: |
| **Pricing** | **100% Free & Open Source** | Freemium ($9-$99/mo) | Freemium ($6-$12/mo) |
| **File Size Limits** | **Unlimited** (Self-Hosted) | 25 MB Limit | 15 MB Limit |
| **Data Privacy** | **100% Local / Self-Hosted** | Files stored on external servers | Files uploaded to cloud |
| **Browser Offline Mode** | **Yes (`pdf-lib` fallback)** | ❌ No | ❌ No |
| **Watch Folder Automation** | **Yes (`watch_daemon.py`)** | ❌ No | ❌ No |
| **Spotlight Command Palette (`Ctrl+K`)** | **Yes** | ❌ No | ❌ No |
| **Gamification & Quests** | **Yes (Badges & XP)** | ❌ No | ❌ No |
| **Multi-Language Support** | **7 Languages (EN, ES, FR, DE, JA, ZH, HI)** | English Only | Limited |

---

## 🌟 Key Features

| Feature Module | Description & Capabilities |
| :--- | :--- |
| 📁 **Batch File Converter** | Convert **50+ formats** (Document, Image, Audio, Video, Data). Drag-and-drop queue with real-time conversion progress bars. |
| ⚡ **Watch Folder Daemon** | Background automation daemon (`watch_daemon.py`) that monitors designated local input folders and converts incoming files automatically. |
| 📄 **Full PDF Suite** | **Merge**, **Split** (custom ranges & ZIP archives), **Compress** (80-90% size reduction), **Encrypt** (AES password), **Decrypt**, and **Rotate** PDFs. |
| 🌐 **Offline Client Mode** | Standalone browser execution mode using `pdf-lib` when running without a Python server backend. |
| 🧮 **Unit Converter** | **10-category engine** covering Data, Length, Weight, Speed, Temperature, Area, Volume, Time, Energy, and Pressure (100+ units). |
| 📊 **Activity Analytics** | Live tracking of total files converted, bandwidth processed, time saved metrics, and historical activity logs. |
| 🏆 **Achievements & Badges** | Milestone quest progress bars, XP rewards, dynamic badge unlocks, audio SFX, and persistent `localStorage` saving. |
| 🔍 **Spotlight Command Palette** | Instant global search modal (**`Ctrl + K`**) to launch any converter or tool in under 1 second. |

---

## 📑 Supported File Formats

OmniConverter supports automated format auto-detection and conversion across 50+ media types:

| Media Category | Supported Extension Formats |
| :--- | :--- |
| 📄 **Documents** | `PDF`, `DOCX`, `XLSX`, `PPTX`, `TXT`, `RTF`, `ODT`, `HTML` |
| 🖼️ **Images** | `PNG`, `JPG`, `JPEG`, `WEBP`, `GIF`, `BMP`, `TIFF`, `SVG` |
| 🎵 **Audio** | `MP3`, `WAV`, `AAC`, `OGG`, `FLAC`, `M4A` |
| 🎥 **Video** | `MP4`, `AVI`, `MKV`, `MOV`, `WEBM` |
| 📊 **Data & Code** | `CSV`, `JSON`, `XML`, `YAML`, `TSV`, `SQL` |

---

## 💻 Quick Start

### 🚀 Option 1: Desktop One-Click Launchers (Recommended)

#### 🪟 Windows:
Double-click `run.bat` or run in PowerShell:
```powershell
.\run.bat
```

#### 🐧 Linux & 🍎 macOS:
```bash
chmod +x run.sh
./run.sh
```
*The launcher automatically initializes a Python virtual environment, installs dependencies from `requirements.txt`, launches FastAPI on `http://localhost:8500`, and opens your default web browser.*

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

Double-click `omni.html` directly in any web browser! All client-side tools (PDF operations via `pdf-lib`, Unit Converters, and Achievements) run **100% offline** without requiring Python installed.

---

## ⚡ Watch Folder Automation Daemon

Automatically convert incoming files placed in a local directory:

```bash
python watch_daemon.py --input ./watch_input --output ./watch_output --target pdf
```

- **Monitors**: Incoming files in real time using `watchdog`.
- **Converts**: Automatically transforms incoming files to your target format and outputs them instantly.

---

<details>
<summary><b>🔌 REST API Reference (Click to Expand)</b></summary>

<br>

OmniConverter provides a comprehensive RESTful API for seamless backend integration:

### 1. Batch File Conversion
```http
POST /api/convert
Content-Type: multipart/form-data

file: [Binary File]
target_format: "pdf" | "docx" | "png" | "jpg" | "webp" | "mp3" | "json"
```

### 2. Merge PDFs
```http
POST /api/pdf/merge
Content-Type: multipart/form-data

files: [Binary File 1, Binary File 2, ...]
```

### 3. Split PDF
```http
POST /api/pdf/split
Content-Type: multipart/form-data

file: [Binary File]
range: "1-3, odd"
output_type: "single_pdf" | "zip"
```

### 4. Compress PDF
```http
POST /api/pdf/compress
Content-Type: multipart/form-data

file: [Binary File]
level: "low" | "medium" | "high"
```

### 5. Encrypt PDF (Protect)
```http
POST /api/pdf/protect
Content-Type: multipart/form-data

file: [Binary File]
password: "SecretPassword123"
```

### 6. Decrypt PDF (Unlock)
```http
POST /api/pdf/unlock
Content-Type: multipart/form-data

file: [Binary File]
password: "SecretPassword123"
```

### 7. Health Check
```http
GET /api/health
```

</details>

---

<details>
<summary><b>❓ Frequently Asked Questions / FAQ (Click to Expand)</b></summary>

<br>

#### Q1: Is OmniConverter completely free?
**Yes!** OmniConverter is 100% free and open-source under the MIT license. There are no subscriptions, hidden fees, or file limits.

#### Q2: Are my uploaded files safe?
**100% Safe.** Files processed through the Python server stay strictly on your local machine or self-hosted server. In standalone mode (`omni.html`), conversion logic runs entirely inside your browser!

#### Q3: Can I run OmniConverter without Python installed?
**Yes!** Opening `omni.html` directly in any modern browser enables client-side PDF processing (powered by `pdf-lib`), multi-unit conversions, and achievements with zero dependencies.

</details>

---

## 🏗️ Architecture & Repository Structure

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

## 🤝 Contributing & Community

Contributions are what make the open-source community an extraordinary place to learn, inspire, and create!

- **⭐ Star the Repo**: Show your support by giving us a star on [GitHub](https://github.com/Winter-Cream/OmniConverter)!
- **🐛 Submit Issues**: Report conversion bugs or request new features.
- **🛠️ Submit Pull Requests**: Read our [**Contributing Guidelines**](.github/CONTRIBUTING.md) to get started.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by the Winter-Cream / OmniConverter Team</sub>
</div>
