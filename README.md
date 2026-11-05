<div align="center">
  <img src="assets/logo.png" alt="OmniConverter logo" width="150" />
  <h1>OmniConverter</h1>
  <p><strong>Convert files, work with PDFs, and use AI tools from one self-hosted workspace.</strong></p>
  <p>
    <a href="https://github.com/Winter-Cream/OmniConverter/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Winter-Cream/OmniConverter?style=flat-square" alt="License"></a>
    <a href="https://github.com/Winter-Cream/OmniConverter/stargazers"><img src="https://img.shields.io/github/stars/Winter-Cream/OmniConverter?style=flat-square" alt="GitHub stars"></a>
    <a href="https://github.com/Winter-Cream/OmniConverter/commits/main"><img src="https://img.shields.io/github/last-commit/Winter-Cream/OmniConverter?style=flat-square" alt="Last commit"></a>
    <a href="https://github.com/Winter-Cream/OmniConverter/issues"><img src="https://img.shields.io/github/issues/Winter-Cream/OmniConverter?style=flat-square" alt="Open issues"></a>
    <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square" alt="Python and FastAPI">
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square" alt="React and Vite">
  </p>
  <p>
    <a href="#get-started">Get started</a> ·
    <a href="#supported-formats">Supported formats</a> ·
    <a href="#api-quick-example">API</a> ·
    <a href="https://github.com/Winter-Cream/OmniConverter/issues">Report an issue</a>
  </p>
</div>

---

## See it in action

<div align="center">
  <table>
    <tr><td align="center" width="800">
      <strong>Product demo</strong><br><br>
      🎬 A screen-recording demo is coming soon.<br>
      Replace this panel with <code>docs/demo.gif</code> when a demo is ready.
    </td></tr>
  </table>
</div>

## Why OmniConverter?

- ⚡ **One place for everyday file work** — convert supported files, handle PDFs, and batch-process files through one interface.
- 🔒 **Run it on your own machine** — file conversion is handled by the local OmniConverter server; no conversion service account is required.
- 🧭 **A practical web interface** — the React app presents format choices and tools without requiring command-line use.
- 🔁 **Automate repeat work** — configure a watch folder to convert incoming files into a separate output folder.
- 🤖 **Choose how OmniAI runs** — use built-in answers, a local Ollama model, or configure a supported cloud/API provider.

> OmniAI cloud providers receive the prompts sent to them. Provider API keys are stored in the browser's local storage. Use Built-in or Ollama for local prompt handling.

## Features

- Convert individual files or batches and download batch output as a ZIP archive.
- Merge, split, compress, protect, unlock, rotate, and extract/OCR text from PDFs.
- Extract text from supported PDFs and images using the installed OCR engine.
- Convert common measurement units.
- Monitor a configured input folder and move successful conversions to an output folder. Successfully converted source files are removed from the input folder; keep the output folder separate from the input folder.
- Ask OmniAI for built-in help or connect Ollama, OpenAI, Gemini, Anthropic, xAI, or a custom OpenAI-compatible chat API.

## Supported formats

OmniConverter currently advertises **47 input extensions**. Valid output choices depend on the selected input; the app and `/api/formats` endpoint provide the available targets.

| Type | Supported input extensions |
| --- | --- |
| Documents | `.pdf`, `.docx`, `.txt`, `.html`, `.htm`, `.md` |
| Presentations | `.pptx` |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.tiff`, `.ico`, `.svg` |
| Audio* | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.opus` |
| Video* | `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`, `.flv`, `.wmv`, `.m4v` |
| Data and spreadsheets | `.csv`, `.tsv`, `.xlsx`, `.json`, `.xml`, `.yaml`, `.yml` |
| Code and text | `.py`, `.js`, `.ts`, `.sql`, `.java`, `.c`, `.cpp`, `.rs`, `.go` |

**Format notes:** Legacy Excel `.xls` is not supported. Spreadsheet conversions to a single-table output use the first worksheet. PPTX-to-PDF conversion reconstructs slide content and may not preserve the original layout.

\* Audio and video conversion requires FFmpeg installed and available on `PATH`. Check `/api/health` to see whether the server detects FFmpeg.

## Get started

### Choose an install method

| Method | Availability |
| --- | --- |
| GitHub Releases / standalone executables | No published binaries yet. |
| Package managers | No package-manager manifests are currently provided. |
| Docker | Supported; build the frontend assets first, then build the image below. |
| Run from source | Supported on Windows, macOS, and Linux with Python; Node.js/npm are needed to build the frontend. |

### Run from source

Requirements: Python 3.10+, Node.js with npm. Install FFmpeg as well if you need audio or video conversions.

#### Windows

Run from the repository folder:

```powershell
./run.bat
```

The launcher installs Python requirements, builds the frontend if the production bundle is missing, and starts the server. Open the local address printed in the terminal (normally `http://localhost:8500`).

#### macOS / Linux

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

Open the address printed by the server. The `run.sh` launcher is also available.

### Run with Docker

Build the React frontend before building the image:

```bash
cd frontend
npm ci
npm run build
cd ..
docker build -t omniconverter .
docker run --rm -p 8500:8500 omniconverter
```

Then open [http://localhost:8500](http://localhost:8500). The Docker image includes FFmpeg and Poppler utilities.

## Usage

### Convert files in the app

1. Start OmniConverter and open its local web address.
2. Add or drop a file (or select multiple files for a batch).
3. Choose one of the output formats offered for the selected input.
4. Start conversion and save the result. Batch results are provided as a ZIP archive.

### Configure OmniAI

Open OmniAI settings, choose a provider, and enter the required model/API details. Built-in mode needs no key. Ollama requires a running local server and installed model. Cloud providers require a valid key and model. Custom providers must expose an OpenAI-compatible chat-completions endpoint.

### Watch a folder

Use the watch-folder controls in the app to choose an input folder, a separate output folder, and a target format. The server must have filesystem access to both folders. Successfully converted source files are removed from the input folder.

## API quick example

With the server running, check health and supported formats:

```bash
curl http://localhost:8500/api/health
curl http://localhost:8500/api/formats
```

Convert a DOCX file to PDF:

```bash
curl -X POST http://localhost:8500/api/convert \
  -F "file=@document.docx" \
  -F "target_format=pdf" \
  -o document.pdf
```

Convert a batch of images to WebP and receive a ZIP:

```bash
curl -X POST http://localhost:8500/api/convert/zip \
  -F "files=@photo-one.png" \
  -F "files=@photo-two.png" \
  -F "target_format=webp" \
  -o converted-files.zip
```

Interactive API documentation is available at `/docs` when `OMNI_ENV=dev`.

## How it works

```text
React + Vite web app  →  FastAPI backend  →  format-specific conversion libraries
                                           ├─ FFmpeg for audio/video
                                           ├─ PDF, Office, image, and data tooling
                                           └─ optional local or remote OmniAI provider
```

The browser serves as the user interface. The Python backend validates requests and performs conversions on the machine running the server. A background watch-folder daemon handles configured incoming files. OmniAI can use built-in responses, a local Ollama endpoint, or a configured external API.

## Development

```bash
python -m pip install -r requirements.txt
python -m pytest -q
cd frontend
npm ci
npm run build
npm run lint
```

The repository's GitHub Actions workflow runs Python lint checks and tests on pushes and pull requests to `main` and `develop`.

## Contributing

Bug reports, reproducible conversion examples, and focused pull requests are welcome. Please open an issue for larger changes, include sample input/output details where possible, and run the relevant checks above before submitting a pull request.

## Roadmap

- [ ] Add a short product demo and screenshots.
- [ ] Publish signed standalone builds for desktop platforms.
- [ ] Expand conversion coverage and document format-specific fidelity limits.
- [ ] Add broader automated coverage for conversion workflows across operating systems.

## License

OmniConverter is distributed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built for practical file conversion on your own machine.</sub>
</div>
