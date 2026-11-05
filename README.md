# OmniConverter

<p align="center">
  <img src="assets/logo.png" alt="OmniConverter logo" width="150" />
</p>

OmniConverter is a local-first file conversion app with a React interface and a Python/FastAPI backend. It converts files across 47 supported input extensions, includes common PDF tools, and can watch a folder for new files to convert.

File conversion runs on the machine hosting OmniConverter. OmniAI can use its built-in knowledge mode or a configured local or cloud model; cloud providers receive the prompts sent to them.

[![CI](https://github.com/Winter-Cream/OmniConverter/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Winter-Cream/OmniConverter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)

## Features

- **File conversion:** Documents, images, audio, video, spreadsheets, structured data, and code files. Available targets depend on the input format; the app shows the supported choices for each file.
- **Batch conversion:** Convert a group of files to one target format and download the outputs in a ZIP archive.
- **PDF tools:** Merge, split, compress, protect, unlock, rotate, and extract text from PDFs.
- **OCR:** Extract text from PDFs and supported image files using the installed OCR engine.
- **Watch folder:** Monitor an input directory and save converted files to an output directory. Successfully converted source files are removed from the input folder. Keep the output folder separate from the input folder.
- **Unit converter:** Convert values across common measurement categories.
- **OmniAI:** Use built-in answers, a local Ollama model, or configured OpenAI, Gemini, Anthropic, xAI, and OpenAI-compatible APIs.

## Supported formats

The converter advertises these **47 input extensions**. Not every input can convert to every output; the `/api/formats` endpoint and the UI list valid targets per input.

| Category | Inputs |
| --- | --- |
| Documents | PDF, DOCX, TXT, HTML, HTM, MD |
| Presentations | PPTX |
| Images | PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF, ICO, SVG |
| Audio* | MP3, WAV, OGG, FLAC, AAC, M4A, OPUS |
| Video* | MP4, WEBM, MKV, AVI, MOV, FLV, WMV, M4V |
| Data and spreadsheets | CSV, TSV, XLSX, JSON, XML, YAML, YML |
| Code and text | PY, JS, TS, SQL, JAVA, C, CPP, RS, GO |

**Known format limitations:** Legacy Excel `.xls` files are not supported. Spreadsheet exports to a single-table format use the first worksheet. PPTX-to-PDF conversion preserves extracted slide content, but its layout may differ from the original presentation.

\* Audio and video conversions require FFmpeg installed and available on `PATH`. The API health endpoint reports whether FFmpeg is detected.

## Requirements

- Python 3.10 or newer
- Node.js and npm to build the React frontend
- FFmpeg for audio and video conversions

## Quick start

### Windows

From the repository folder, run:

```bat
run.bat
```

The launcher installs the Python requirements, builds the frontend if its production bundle is missing, and starts the server. Open the URL printed by the server, normally `http://localhost:8500`.

### Linux or macOS

Create a virtual environment, install the Python dependencies, build the frontend, and start the server:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd frontend
npm ci
npm run build
cd ..
python server.py
```

Open the URL printed in the terminal. `run.sh` is also available as a convenience launcher.

## Build the frontend

When changing the React app, rebuild its production assets before launching the backend:

```bash
cd frontend
npm ci
npm run build
```

For frontend development with Vite:

```bash
cd frontend
npm ci
npm run dev
```

## Docker

Build the frontend first, then build and run the container from the repository root:

```bash
cd frontend
npm ci
npm run build
cd ..
docker build -t omniconverter .
docker run --rm -p 8500:8500 omniconverter
```

The Docker image installs FFmpeg. Open `http://localhost:8500`.

## OmniAI setup

Open OmniAI settings in the app and select a provider. The built-in mode needs no key. Ollama needs a running local Ollama server and an installed model. Cloud providers need a valid API key and an available model for that account. Custom endpoints must provide an OpenAI-compatible chat-completions API.

API keys are saved in the browser’s local storage and sent to the local backend for provider authentication. Cloud prompts are sent to the selected provider. Use Built-in or Ollama when you want prompts to stay local to your machine.

## REST API

The backend exposes endpoints for health checks, format metadata, conversions, PDF operations, OCR, watch-folder configuration, and OmniAI. Start the server, then check:

```bash
curl http://localhost:8500/api/health
curl http://localhost:8500/api/formats
```

Convert a file with `POST /api/convert`:

```bash
curl -X POST http://localhost:8500/api/convert \
  -F "file=@document.docx" \
  -F "target_format=pdf" \
  -o document_converted.pdf
```

Convert multiple files to a ZIP with `POST /api/convert/zip`:

```bash
curl -X POST http://localhost:8500/api/convert/zip \
  -F "files=@photo-one.png" \
  -F "files=@photo-two.png" \
  -F "target_format=webp" \
  -o converted-files.zip
```

Interactive API documentation is available at `/docs` when the server is started with `OMNI_ENV=dev`.

## Run checks

Install the project requirements, then run the test suite:

```bash
python -m pytest -q
```

Build the frontend with:

```bash
cd frontend
npm run build
```

The GitHub Actions workflow runs lint checks and the Python tests on pushes and pull requests to `main` and `develop`.

## Update the GitHub repository

After reviewing your changes, use these commands from the repository root to commit and push the current working tree to `main`:

```bash
git status
git add -A
git commit -m "docs: refresh README and verified project capabilities"
git push origin main
```

`git add -A` stages all current project changes, not only this README. Review `git status` before committing.

## License

OmniConverter is licensed under the [MIT License](LICENSE).
