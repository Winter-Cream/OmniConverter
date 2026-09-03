<div align="center">

# 🚀 OmniConverter
### High-Performance Universal Media Engine • Pro PDF Suite • On-Device AI OCR

[![CI Build](https://img.shields.io/github/actions/workflow/status/Winter-Cream/OmniConverter/ci.yml?branch=main&label=CI%20Build&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/Winter-Cream/OmniConverter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Python: 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25_Local-8b5cf6?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/Winter-Cream/OmniConverter)

<p align="center">
  <b>The open-source, local-first alternative to CloudConvert, Smallpdf, and Adobe Acrobat.</b><br>
  <i>100% private. 100% offline-capable. Zero file caps. Hardware-accelerated directly on your machine.</i>
</p>

<p align="center">
  <a href="#quick-start"><b>🚀 Quick Start</b></a> •
  <a href="#why-omniconverter"><b>💡 Why Us?</b></a> •
  <a href="#which-mode"><b>🧭 Which Mode?</b></a> •
  <a href="#core-features"><b>✨ Features</b></a> •
  <a href="#supported-formats"><b>📑 50+ Formats</b></a> •
  <a href="#system-dependencies"><b>📦 Dependencies</b></a> •
  <a href="#rest-api"><b>🔌 REST API</b></a> •
  <a href="#troubleshooting"><b>🛠️ Troubleshooting</b></a>
</p>

</div>

---

<a id="why-omniconverter"></a>
## 💡 Why OmniConverter?

Commercial cloud converters subject users to **paywalls, strict 15–25 MB upload limits, intrusive advertisements**, and **severe privacy liabilities** by sending personal documents, financial statements, and confidential videos to third-party remote servers.

**OmniConverter solves this completely.** Built on a high-speed Python FastAPI backend with a sleek, responsive interface, it processes everything directly on your local silicon with zero cloud uploads, zero telemetry, and hardware-bound performance limits.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🔒 100% Local & Private</h3>
      <p>Every conversion, OCR scan, and PDF manipulation is executed strictly on your local machine. No telemetry, no external API leaks, and no cloud uploads.</p>
    </td>
    <td width="50%" valign="top">
      <h3>⚡ Unlimited File Sizes</h3>
      <p>No 25 MB paywalls or artificial upload queues. Process 10 GB videos, 2,000-page PDF archives, and massive folders limited only by your disk and RAM.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📄 Professional 6-in-1 PDF Suite</h3>
      <p>Merge, split by custom page ranges (<code>1-5, odd, even</code>), compress file weight by up to 85%, rotate, encrypt with AES-256, and decrypt PDF files.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🧠 On-Device Neural Vision (OCR)</h3>
      <p>High-precision optical character recognition powered by the local RapidOCR ONNX engine. Extract text from flattened documents, scans, and photos.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📁 Headless Watch Folder Daemon</h3>
      <p>Automated background file ingestion service (<code>watch_daemon.py</code>) with thread-safe database locking and Windows write-lock verification.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🎯 Spotlight Command Palette (<kbd>Ctrl</kbd> + <kbd>K</kbd>)</h3>
      <p>Sub-10ms keyboard-driven command navigation, real-time scientific multi-unit calculator across 100+ units, and modern glassmorphic UI.</p>
    </td>
  </tr>
</table>

---

<a id="which-mode"></a>
## 🧭 Which Mode Should I Use?

| Mode | Best For | Prerequisites | How to Launch |
| :--- | :--- | :--- | :--- |
| **Zero-Install Offline Mode** | Quick, single-file conversions & client-side PDF tasks without installing Python. | Any Modern Web Browser | Open [`templates/index.html`](templates/index.html) |
| **1-Click Desktop Launcher** | Full workstation experience with complete audio/video, OCR, and PDF support. | Python 3.9+ | Run `run.bat` (Windows) or `./run.sh` (Linux/macOS) |
| **Docker Container Mode** | Headless servers, homelabs, or self-hosted team setups with zero host pollution. | Docker Engine | `docker run -d -p 8500:8500 omniconverter` |

---

<a id="core-features"></a>
## ✨ Core Features

### 📁 1. Universal Media & Data Conversion
* **50+ Supported Formats**: Transcode across documents, vector graphics, raster photos, audio tracks, videos, and structured datasets.
* **Granular Encoding Parameters**: Configure custom video resolutions (`1080p`, `720p`, `480p`), audio bitrates (`320k` to `128k`), audio stripping, dimensional resizing with locked aspect ratios, and compression quality sliders.
* **One-Click Batch ZIP Compilation**: Process an entire queue of diverse files simultaneously and download them individually or bundled into an instant `.zip` archive.

### 📄 2. Pro PDF Powerhouse
* **Merge PDFs**: Combine multiple PDF documents into a single document with customized ordering.
* **Split & Extract**: Extract specific page intervals (`1-5, 8, odd, even`) into standalone PDFs or a structured ZIP archive.
* **Compress PDF**: Optimize vector streams and embedded images to shrink file size by up to **85%** without sacrificing legibility.
* **AES-256 Encryption**: Protect sensitive financial, medical, or legal documents with password-protected AES encryption.
* **Unlock & Decrypt**: Authenticate and permanently remove permission restrictions from password-protected files.
* **Rotate Pages**: Fix scan orientation mistakes with 90°, 180°, or 270° clockwise adjustments.

### 🧠 3. RapidOCR Neural Studio
* **On-Device Optical Character Recognition**: Extract machine-readable text from flattened PDFs, scanned invoices, receipts, and photos (`PNG`, `JPG`, `TIFF`, `WEBP`) using the **RapidOCR ONNX Runtime**.
* **Interactive Document Inspector**: Page-by-page text navigation, real-time word and character counters, OCR confidence score badges, and 1-click export to `.txt` or `.md`.

### ⚡ 4. Headless Watch Folder Daemon
* Set an automated input directory (e.g., `C:\OmniWatch\Input` or `./watch_input`).
* The background daemon (`watch_daemon.py`) monitors the folder, verifies that writing processes have released file locks, converts items, and exports results into target output folders automatically.

### 🧮 5. Scientific Multi-Unit Converter
* **10 Scientific Disciplines & 100+ Units**: Data Storage, Length, Weight, Speed, Temperature, Area, Volume, Time, Energy, and Pressure.
* **Real-Time Bidirectional Sync**: Instant updates as you type with live baseline formulas (e.g. `1 Wh = 0.860421 kcal`).
* **Custom Dropdowns**: Clean glassmorphic selection menus, quick value presets (`1`, `5`, `10`, `100`, `1000`), and animated unit swapping.

### 🤖 6. OmniAI Floating Assistant
* On-screen intelligent assistant capable of answering questions regarding conversions, PDF workflows, and mathematical formulas.
* **Bring Your Own Key (BYOK)**: Supports **Google Gemini**, **OpenAI**, **xAI Grok**, and **Anthropic Claude**, or run completely free with the **Built-in Offline Knowledge Engine**.
* **Web Audio TTS**: Listen to replies with synthesized voice audio playback.

---

<a id="supported-formats"></a>
## 📑 Supported Formats Matrix

| Category | Input Formats | Target Output Formats | Processing Subsystem |
| :--- | :--- | :--- | :--- |
| **Documents** | `PDF`, `DOCX`, `TXT`, `RTF`, `ODT`, `HTML`, `MD` | `PDF`, `DOCX`, `TXT`, `HTML`, `MD` | PyMuPDF, pypdf, python-docx |
| **Images** | `PNG`, `JPG`, `JPEG`, `WEBP`, `GIF`, `BMP`, `TIFF`, `ICO`, `SVG` | `PNG`, `JPG`, `WEBP`, `BMP`, `ICO`, `PDF` | Pillow (PIL), PyMuPDF |
| **Audio** | `MP3`, `WAV`, `AAC`, `OGG`, `FLAC`, `M4A`, `OPUS` | `MP3`, `WAV`, `AAC`, `OGG`, `FLAC` | FFmpeg Subsystem |
| **Video** | `MP4`, `MKV`, `AVI`, `MOV`, `WEBM`, `FLV`, `WMV` | `MP4`, `WEBM`, `GIF`, `MP3` *(Audio Extraction)* | FFmpeg Subsystem |
| **Data & Tables** | `CSV`, `XLSX`, `JSON`, `XML`, `YAML`, `TSV`, `TOML` | `CSV`, `XLSX`, `JSON`, `TXT` | Pandas, OpenPyXL, Python standard libraries |
| **Neural OCR** | Scanned `PDF`, `PNG`, `JPG`, `JPEG`, `TIFF`, `WEBP`, `BMP` | Machine-Readable Text (`TXT`, `MD`, `JSON`) | RapidOCR (ONNX Runtime), PyMuPDF |

---

<a id="quick-start"></a>
## 🚀 Quick Start

### Method A: 1-Click Desktop Launcher (Recommended for Workstations)

#### Windows
Double-click `run.bat` or execute in PowerShell:
```powershell
.\run.bat
```

#### Linux & macOS
Make the launcher executable and run:
```bash
chmod +x run.sh
./run.sh
```
*The launcher automatically initializes a Python virtual environment, verifies dependencies, starts the FastAPI server at `http://localhost:8500`, and opens your default browser.*

---

### Method B: Manual Python Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Winter-Cream/OmniConverter.git
cd OmniConverter
```

#### 2. Create and Activate a Virtual Environment
* **Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
* **Windows (Command Prompt / PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```

#### 3. Install Package Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 4. Launch the Server
```bash
python server.py
```
Open **`http://localhost:8500`** in your web browser.

---

### Method C: Docker Container Deployment

Run an isolated, production-grade container with all binary dependencies pre-configured:

```bash
# Build the Docker image
docker build -t omniconverter:latest .

# Run the container on port 8500
docker run -d -p 8500:8500 --name omniconverter_app omniconverter:latest
```
Access the application at `http://localhost:8500`.

---

### Method D: Zero-Install Offline Browser Mode

No Python or terminal required! Open [`templates/index.html`](templates/index.html) directly in any browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari). Client-side tools, unit conversions, and client-side PDF utilities run completely offline in your browser sandbox.

---

<a id="system-dependencies"></a>
## 📦 System Dependencies

OmniConverter handles standard image, document, spreadsheet, and client-side PDF operations natively with Python and browser libraries. For advanced multimedia transcoding (audio/video conversion) and vector rendering, install **FFmpeg** and **Poppler** on your system:

### Windows
Install via Windows Package Manager or Chocolatey:
```powershell
# Using winget
winget install Gyan.FFmpeg

# Using Chocolatey
choco install ffmpeg
```

### Ubuntu / Debian
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg poppler-utils
```

### macOS
```bash
brew update
brew install ffmpeg poppler
```

---

<a id="rest-api"></a>
## 🔌 REST API Reference

OmniConverter provides clean asynchronous REST endpoints for headless integrations and automation scripts:

### 1. Single File Conversion (`POST /api/convert`)
```bash
curl -X POST "http://localhost:8500/api/convert" \
  -F "file=@document.docx" \
  -F "target_format=pdf" \
  -o "converted_document.pdf"
```

### 2. Batch ZIP Conversion (`POST /api/batch-convert`)
```bash
curl -X POST "http://localhost:8500/api/batch-convert" \
  -F "files=@image1.png" \
  -F "files=@image2.png" \
  -F "target_format=webp" \
  -o "converted_batch.zip"
```

### 3. Merge PDF Documents (`POST /api/pdf/merge`)
```bash
curl -X POST "http://localhost:8500/api/pdf/merge" \
  -F "files=@section1.pdf" \
  -F "files=@section2.pdf" \
  -o "merged_document.pdf"
```

### 4. Split PDF Document (`POST /api/pdf/split`)
```bash
curl -X POST "http://localhost:8500/api/pdf/split" \
  -F "file=@annual_report.pdf" \
  -F "page_range=1-5" \
  -F "mode=single_pdf" \
  -o "report_pages_1-5.pdf"
```

### 5. Compress PDF Document (`POST /api/pdf/compress`)
```bash
curl -X POST "http://localhost:8500/api/pdf/compress" \
  -F "file=@heavy_scan.pdf" \
  -F "level=medium" \
  -o "compressed_document.pdf"
```

### 6. AI Assistant Interaction (`POST /api/ai/chat`)
```bash
curl -X POST "http://localhost:8500/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I compress a large PDF?", "provider": "builtin"}'
```

### 7. Engine Health Check (`GET /api/health`)
```bash
curl -X GET "http://localhost:8500/api/health"
```

---

## 🧪 Testing & Quality Assurance

The codebase includes an automated test suite verifying endpoint responses, format validation, PDF transformations, and database mutex synchronization:

```bash
# Run the complete test suite with verbose output
pytest tests/ -v
```

All 26 integration and OCR tests are automatically verified on every push and pull request via the [GitHub Actions CI/CD Pipeline](https://github.com/Winter-Cream/OmniConverter/actions).

---

<a id="troubleshooting"></a>
## 🛠️ Troubleshooting

### `Port 8500 Already in Use`
* **Behavior**: `server.py` features automatic port fallback (`find_available_port`). If port `8500` is currently bound by another service, the server automatically discovers and binds to the next sequential free port (e.g., `8501`, `8502`).
* **Manual Override**: To free port 8500, terminate the conflicting process:
  * **Windows**: `netstat -ano | findstr :8500` followed by `taskkill /PID <PID> /F`
  * **Linux / macOS**: `lsof -i :8500` followed by `kill -9 <PID>`

### `FileNotFoundError: 'ffmpeg' or 'ffmpeg.exe' not found`
* **Root Cause**: The FFmpeg multimedia binary is not installed or its directory has not been added to your system `PATH` environment variable.
* **Solution**: Install FFmpeg via `brew install ffmpeg` (macOS), `apt-get install ffmpeg` (Linux), or `winget install Gyan.FFmpeg` (Windows). Restart your active terminal shell and verify availability by executing `ffmpeg -version`.

### `MemoryError / High System Latency on Large Files`
* **Root Cause**: Operating on files exceeding available physical RAM (e.g., 4K video transcoding or multi-gigabyte archival PDFs).
* **Solution**: Ensure your target format uses streaming codecs. When splitting or compressing large PDFs, allocate sufficient swap space or process documents in smaller page ranges (`--split 1-50`).

### `UnsupportedFormatError / Incompatible Conversion Pair`
* **Root Cause**: Requesting conversions across incompatible semantic domains (e.g., attempting to convert an MP3 audio track directly into an XLSX spreadsheet).
* **Solution**: Consult the [Supported Formats Matrix](#supported-formats-matrix). OmniConverter rejects cross-domain operations that would result in corrupted outputs.

### `PermissionError: [Errno 13] Permission denied` (Windows Watch Folder)
* **Root Cause**: A third-party process or network transfer is actively writing to the file within the monitored directory before the daemon attempts read access.
* **Solution**: `watch_daemon.py` includes built-in `is_file_ready()` verification. Ensure the file has finished writing before ingestion, or check folder access permissions for the executing user.

---

## 📂 Project Structure & Contribution

### Repository Directory Layout

```
OmniConverter/
├── frontend/                   # Modern React 19 + Vite Web Application
│   ├── src/                    # Modular UI components (Hub, PDF, Units, OCR, AI)
│   ├── vite.config.js          # Vite build & proxy configuration
│   └── package.json            # Node.js dependencies
├── converter_engine.py         # Multi-format conversion & PDF processing engine
├── server.py                   # FastAPI asynchronous backend & routing
├── watch_daemon.py             # Headless Watchdog folder automation service
├── templates/
│   └── index.html              # Primary Jinja2 / SPA interface entrypoint
├── static/
│   ├── css/
│   │   └── style.css           # Vanilla CSS stylesheet & design tokens
│   └── js/
│       └── app.js              # Client-side interface & conversion logic
├── tests/
│   ├── test_api.py             # FastAPI REST endpoint integration suites
│   └── test_ocr.py             # RapidOCR vision verification tests
├── requirements.txt            # Python package dependencies
├── run.bat                     # 1-Click Windows desktop launcher
├── run.sh                      # 1-Click Linux / macOS launcher
├── Dockerfile                  # Container deployment definition
├── pytest.ini                  # Pytest configuration file
├── LICENSE                     # MIT open-source license
└── README.md                   # Project documentation
```

### How to Contribute

Contributions, bug reports, and optimizations are welcome! Please adhere to standard open-source contribution practices:

1. **Fork the Repository**: Create your fork of [`Winter-Cream/OmniConverter`](https://github.com/Winter-Cream/OmniConverter).
2. **Create a Feature Branch**: Branch from `main` (`git checkout -b feat/add-avif-support`).
3. **Commit Clean Changes**: Follow Conventional Commits format (`git commit -m 'feat: implement AVIF image decoding'`).
4. **Validate Test Suite**: Verify that all test suites pass locally (`pytest tests/ -v`).
5. **Open a Pull Request**: Submit your pull request to the `main` branch with a clear description of your modifications.

---

## 📜 License

OmniConverter is open-source software licensed under the [MIT License](LICENSE).
