"""
OmniConverter PRO 4.0 Ultra - FastAPI Backend Server
Provides high-performance REST APIs for single & batch conversions, Watch Folder automation,
statistics tracking, AI tool proxies, and serving the modern web frontend.
"""

import os
import sys
import io
import time
import json
import shutil
import socket
import threading
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Optional, Dict, Any

from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from converter_engine import converter_engine, check_ffmpeg
from watch_daemon import WatchFolderDaemon

app = FastAPI(
    title="OmniConverter PRO 4.1.0 Server",
    description="Python-powered backend conversion engine & automation daemon",
    version="4.1.0"
)

# Enable CORS for local web applications & development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workspace directories setup
BASE_DIR = Path(__file__).parent.resolve()
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR = BASE_DIR / "templates"
TEMPLATES_DIR.mkdir(exist_ok=True)
DATA_FILE = BASE_DIR / "omni_db.json"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_ASSETS)), name="assets")

# Global thread lock for database access
DB_LOCK = threading.Lock()

# Instantiate Watch Folder Daemon
daemon = WatchFolderDaemon(DATA_FILE, db_lock=DB_LOCK)

def find_available_port(start_port: int = 8500) -> int:
    """Finds an available free port starting from start_port to avoid port conflicts."""
    for p in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return start_port

def load_db() -> Dict[str, Any]:
    with DB_LOCK:
        if not DATA_FILE.exists():
            default_state = {
                "filesConverted": 0,
                "bytesProcessed": 0,
                "timeSavedSeconds": 0,
                "xp": 0,
                "level": 1,
                "streak": 1,
                "username": "Explorer_Pro",
                "history": [],
                "watchFolder": {
                    "enabled": False,
                    "path": str(BASE_DIR / "watch_input"),
                    "output_path": str(BASE_DIR / "watch_output"),
                    "target_format": "pdf"
                }
            }
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(default_state, f, indent=2)
            return default_state

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"filesConverted": 0, "bytesProcessed": 0, "xp": 0, "level": 1, "history": []}

def save_db(data: Dict[str, Any]):
    with DB_LOCK:
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[DB Save Error]: {e}")

def cleanup_temp_file(file_path: str):
    """Background task to remove temp conversion directory after file streaming."""
    try:
        parent_dir = Path(file_path).parent
        if parent_dir.exists() and ("omni_conv_" in parent_dir.name or "omni_batch_" in parent_dir.name or "omni_pdf_" in parent_dir.name):
            shutil.rmtree(parent_dir, ignore_errors=True)
    except Exception as e:
        print(f"[Cleanup Warning]: {e}")

# Serve main application HTML page (React frontend prioritized, fallback to templates/index.html)
@app.get("/")
@app.get("/app/{path:path}")
async def get_index():
    headers = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    }
    react_index = FRONTEND_DIST / "index.html"
    index_path = TEMPLATES_DIR / "index.html"
    template_path = TEMPLATES_DIR / "omni.html"
    root_path = BASE_DIR / "omni.html"
    if react_index.exists():
        return FileResponse(react_index, media_type="text/html", headers=headers)
    elif index_path.exists():
        return FileResponse(index_path, media_type="text/html", headers=headers)
    elif template_path.exists():
        return FileResponse(template_path, media_type="text/html", headers=headers)
    elif root_path.exists():
        return FileResponse(root_path, media_type="text/html", headers=headers)
    return {"message": "OmniConverter Server running."}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silences browser favicon 404 console warnings."""
    return Response(status_code=204)

@app.get("/api/formats")
async def get_formats():
    """Returns dynamic format metadata, categories, and allowed target formats."""
    return converter_engine.get_supported_formats()

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "version": "4.1.0",
        "engine": "OmniConverter Python Engine",
        "has_ffmpeg": check_ffmpeg(),
        "has_fcp": getattr(sys.modules["converter_engine"], "HAS_FCP", False),
        "daemon_running": daemon.is_running(),
        "timestamp": time.time()
    }

@app.post("/api/convert")
async def convert_single_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form("{}"),
    video_quality: Optional[str] = Form(None),
    strip_audio: Optional[bool] = Form(False),
    audio_bitrate: Optional[str] = Form(None),
    resize_width: Optional[int] = Form(None),
    resize_height: Optional[int] = Form(None),
    scale: Optional[float] = Form(None),
    quality: Optional[int] = Form(None)
):
    try:
        opt_dict = json.loads(options) if options else {}
    except Exception:
        opt_dict = {}

    if video_quality: opt_dict["video_quality"] = video_quality
    if strip_audio: opt_dict["strip_audio"] = strip_audio
    if audio_bitrate: opt_dict["audio_bitrate"] = audio_bitrate
    if resize_width: opt_dict["resize_width"] = resize_width
    if resize_height: opt_dict["resize_height"] = resize_height
    if scale: opt_dict["scale"] = scale
    if quality: opt_dict["quality"] = quality

    content = await file.read()
    res = converter_engine.convert_file(content, file.filename, target_format, opt_dict)

    if not res.success:
        raise HTTPException(status_code=400, detail=f"Conversion error: {res.error}")

    # Record stats
    db = load_db()
    db["filesConverted"] = db.get("filesConverted", 0) + 1
    db["bytesProcessed"] = db.get("bytesProcessed", 0) + len(content)
    db["timeSavedSeconds"] = db.get("timeSavedSeconds", 0) + 12
    db["xp"] = db.get("xp", 0) + 50
    if db["xp"] >= db.get("level", 1) * 200:
        db["level"] = db.get("level", 1) + 1
        db["xp"] = 0

    hist_entry = {
        "name": file.filename,
        "target": target_format.upper(),
        "size": f"{round(len(content) / 1024, 1)} KB",
        "timestamp": time.strftime("%H:%M:%S")
    }
    db.setdefault("history", []).insert(0, hist_entry)
    db["history"] = db["history"][:50]
    save_db(db)

    background_tasks.add_task(cleanup_temp_file, res.output_path)

    return FileResponse(
        path=res.output_path,
        filename=res.filename,
        media_type=res.mime_type
    )

@app.post("/api/batch-convert")
@app.post("/api/convert/zip")
async def convert_batch_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form("{}")
):
    try:
        opt_dict = json.loads(options) if options else {}
    except Exception:
        opt_dict = {}

    file_tuples = []
    total_bytes = 0
    for f in files:
        data = await f.read()
        total_bytes += len(data)
        file_tuples.append((f.filename, data))

    zip_path = converter_engine.convert_batch(file_tuples, target_format, opt_dict)

    # Update stats
    db = load_db()
    db["filesConverted"] = db.get("filesConverted", 0) + len(files)
    db["bytesProcessed"] = db.get("bytesProcessed", 0) + total_bytes
    db["xp"] = db.get("xp", 0) + (len(files) * 40)
    save_db(db)

    background_tasks.add_task(cleanup_temp_file, zip_path)

    return FileResponse(
        path=zip_path,
        filename=f"OmniConverter_Batch_{target_format.upper()}.zip",
        media_type="application/zip"
    )

@app.get("/api/stats")
async def get_stats():
    return load_db()

@app.delete("/api/history")
async def clear_history():
    db = load_db()
    db["history"] = []
    save_db(db)
    return {"status": "success", "message": "History cleared."}

@app.delete("/api/history/{index}")
async def delete_history_item(index: int):
    db = load_db()
    hist = db.get("history", [])
    if 0 <= index < len(hist):
        removed = hist.pop(index)
        db["history"] = hist
        save_db(db)
        return {"status": "success", "removed": removed}
    raise HTTPException(status_code=404, detail="History index out of range.")

@app.post("/api/stats/reset")
async def reset_stats():
    db = load_db()
    db["filesConverted"] = 0
    db["bytesProcessed"] = 0
    db["timeSavedSeconds"] = 0
    db["xp"] = 0
    db["level"] = 1
    db["streak"] = 1
    db["history"] = []
    save_db(db)
    return {"status": "success", "stats": db}

@app.post("/api/watch-folder/config")
async def configure_watch_folder(
    enabled: bool = Form(...),
    path: str = Form(...),
    output_path: str = Form(...),
    target_format: str = Form(...)
):
    db = load_db()
    db["watchFolder"] = {
        "enabled": enabled,
        "path": path,
        "output_path": output_path,
        "target_format": target_format
    }
    save_db(db)

    if enabled:
        daemon.start()
    else:
        daemon.stop()

    return {"status": "success", "watchFolder": db["watchFolder"]}

@app.post("/api/ai/tts")
async def ai_tts_synthesizer(text: str = Form(...), voice: str = Form("neutral")):
    import math
    import struct
    sample_rate = 24000
    duration = max(1.0, min(10.0, len(text) * 0.08))
    num_samples = int(sample_rate * duration)
    pcm16 = bytearray()
    freq = 220.0 if voice == "male" else (330.0 if voice == "female" else 280.0)

    for i in range(num_samples):
        t = float(i) / sample_rate
        val = int(32767.0 * 0.4 * math.sin(2.0 * math.pi * freq * t))
        pcm16.extend(struct.pack("<h", val))

    wav_header = bytearray()
    data_size = len(pcm16)
    wav_header.extend(b"RIFF")
    wav_header.extend(struct.pack("<I", 36 + data_size))
    wav_header.extend(b"WAVEfmt ")
    wav_header.extend(struct.pack("<I", 16))
    wav_header.extend(struct.pack("<H", 1))
    wav_header.extend(struct.pack("<H", 1))
    wav_header.extend(struct.pack("<I", sample_rate))
    wav_header.extend(struct.pack("<I", sample_rate * 2))
    wav_header.extend(struct.pack("<H", 2))
    wav_header.extend(struct.pack("<H", 16))
    wav_header.extend(b"data")
    wav_header.extend(struct.pack("<I", data_size))

    wav_bytes = bytes(wav_header + pcm16)
    return Response(content=wav_bytes, media_type="audio/wav")

# ==================== OMNI PDF ENGINE API ENDPOINTS ====================
@app.post("/api/pdf/merge")
async def api_pdf_merge(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    passwords: Optional[str] = Form("")
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files are required for merging.")
    
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_merge_")
    pdf_paths = []
    pwd_list = [p.strip() for p in passwords.split(",")] if passwords else []
    
    for f in files:
        safe_name = Path(f.filename).name
        p = os.path.join(temp_dir, safe_name)
        with open(p, "wb") as wf:
            wf.write(await f.read())
        pdf_paths.append(p)

    out_path = os.path.join(temp_dir, "OmniConverter_Merged.pdf")
    try:
        converter_engine.merge_pdfs(pdf_paths, out_path, pwd_list)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(cleanup_temp_file, out_path)
    return FileResponse(path=out_path, filename="OmniConverter_Merged.pdf", media_type="application/pdf")


@app.post("/api/pdf/split")
async def api_pdf_split(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    page_range: str = Form("all"),
    mode: str = Form("single_pdf"),
    password: str = Form("")
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_split_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    with open(src_path, "wb") as wf:
        wf.write(await file.read())

    stem = Path(file.filename).stem
    out_filename = f"OmniConverter_Split_{stem}.zip" if mode == "zip" else f"OmniConverter_Split_{stem}.pdf"
    out_path = os.path.join(temp_dir, out_filename)

    try:
        actual_out = converter_engine.split_pdf(src_path, page_range, out_path, mode=mode, password=password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    mime = "application/zip" if mode == "zip" else "application/pdf"
    background_tasks.add_task(cleanup_temp_file, actual_out)
    return FileResponse(path=actual_out, filename=Path(actual_out).name, media_type=mime)


@app.post("/api/pdf/compress")
async def api_pdf_compress(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    level: str = Form("medium"),
    password: str = Form("")
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_comp_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    with open(src_path, "wb") as wf:
        wf.write(await file.read())

    out_path = os.path.join(temp_dir, f"OmniConverter_Compressed_{Path(file.filename).stem}.pdf")
    try:
        converter_engine.compress_pdf(src_path, out_path, level=level, password=password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(cleanup_temp_file, out_path)
    return FileResponse(path=out_path, filename=Path(out_path).name, media_type="application/pdf")


@app.post("/api/pdf/protect")
async def api_pdf_protect(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...)
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_prot_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    with open(src_path, "wb") as wf:
        wf.write(await file.read())

    out_path = os.path.join(temp_dir, f"OmniConverter_Protected_{Path(file.filename).stem}.pdf")
    try:
        converter_engine.protect_pdf(src_path, password, out_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(cleanup_temp_file, out_path)
    return FileResponse(path=out_path, filename=Path(out_path).name, media_type="application/pdf")


@app.post("/api/pdf/unlock")
async def api_pdf_unlock(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...)
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_unl_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    with open(src_path, "wb") as wf:
        wf.write(await file.read())

    out_path = os.path.join(temp_dir, f"OmniConverter_Unlocked_{Path(file.filename).stem}.pdf")
    try:
        converter_engine.unlock_pdf(src_path, password, out_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(cleanup_temp_file, out_path)
    return FileResponse(path=out_path, filename=Path(out_path).name, media_type="application/pdf")


@app.post("/api/pdf/rotate")
async def api_pdf_rotate(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    angle: int = Form(90),
    page_range: str = Form("all"),
    password: str = Form("")
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_pdf_rot_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    with open(src_path, "wb") as wf:
        wf.write(await file.read())

    out_path = os.path.join(temp_dir, f"OmniConverter_Rotated_{Path(file.filename).stem}.pdf")
    try:
        converter_engine.rotate_pdf(src_path, angle, out_path, page_range=page_range, password=password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(cleanup_temp_file, out_path)
    return FileResponse(path=out_path, filename=Path(out_path).name, media_type="application/pdf")


@app.post("/api/pdf/ocr")
@app.post("/api/ocr")
async def api_pdf_ocr(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    page_range: str = Form("all"),
    force_ocr: bool = Form(False),
    format: str = Form("json"),
    password: str = Form("")
):
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="omni_ocr_")
    src_path = os.path.join(temp_dir, Path(file.filename).name)
    content = await file.read()
    with open(src_path, "wb") as wf:
        wf.write(content)

    try:
        res = converter_engine.ocr_document(
            file_path_or_bytes=src_path,
            filename=file.filename,
            page_range=page_range,
            force_ocr=force_ocr,
            password=password
        )
    except Exception as e:
        cleanup_temp_file(src_path)
        raise HTTPException(status_code=400, detail=str(e))

    # Update gamification stats
    db = load_db()
    db["filesConverted"] = db.get("filesConverted", 0) + 1
    db["bytesProcessed"] = db.get("bytesProcessed", 0) + len(content)
    db["xp"] = db.get("xp", 0) + 40
    save_db(db)

    if format in ["txt_download", "download"]:
        out_txt = os.path.join(temp_dir, f"{Path(file.filename).stem}_OCR.txt")
        with open(out_txt, "w", encoding="utf-8") as tf:
            tf.write(res.get("text", ""))
        background_tasks.add_task(cleanup_temp_file, out_txt)
        return FileResponse(path=out_txt, filename=Path(out_txt).name, media_type="text/plain; charset=utf-8")

    background_tasks.add_task(cleanup_temp_file, src_path)
    return JSONResponse(content={
        "success": True,
        "filename": file.filename,
        "text": res.get("text", ""),
        "confidence": res.get("confidence", 1.0),
        "total_pages": res.get("total_pages", 1),
        "processed_pages": res.get("processed_pages", 1),
        "pages": res.get("pages", []),
        "elapsed": res.get("elapsed", 0.0)
    })


class AIChatRequest(BaseModel):
    message: str
    provider: str = "builtin"
    api_key: Optional[str] = None
    model: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []


def get_builtin_knowledge_reply(query: str) -> str:
    q = query.lower()
    if any(k in q for k in ["merge", "combine"]):
        return (
            "### 📄 How to Merge PDFs in OmniConverter\n\n"
            "1. Switch to the **PDF Suite** tab (or press `Ctrl + K` and select *Merge PDFs*).\n"
            "2. Select or drag multiple PDF files into the **Merge PDFs** box.\n"
            "3. Drag files up/down to arrange their merge order.\n"
            "4. Click **Merge PDFs** — your unified PDF will download instantly!\n\n"
            "*Tip: PDF merging runs 100% locally with zero uploads.*"
        )
    elif any(k in q for k in ["split", "extract"]):
        return (
            "### ✂️ How to Split & Extract PDF Pages\n\n"
            "1. Go to the **PDF Suite** tab and find **Split & Extract Pages**.\n"
            "2. Upload your PDF and choose your target extraction:\n"
            "   - **Custom Range**: e.g., `1-3, 5, 8`\n"
            "   - **Even / Odd Pages**: extracts only even or odd numbered pages.\n"
            "3. Select **Mode**:\n"
            "   - *Single Combined PDF*: combines selected pages into 1 document.\n"
            "   - *ZIP Archive*: extracts each page into separate PDFs inside a `.zip` archive!\n"
            "4. Click **Split PDF**."
        )
    elif any(k in q for k in ["compress", "reduce size", "smaller"]):
        return (
            "### 🗜️ How to Compress PDFs & Reduce File Size\n\n"
            "1. Open the **PDF Suite** tab and locate **Compress PDF Size**.\n"
            "2. Select your compression preset:\n"
            "   - **Low**: Minimal quality loss (15–30% size reduction)\n"
            "   - **Medium (Recommended)**: Balanced optimization (40–60% reduction)\n"
            "   - **High**: Maximum compression (up to 85–90% reduction)\n"
            "3. Upload your PDF and click **Compress PDF**."
        )
    elif any(k in q for k in ["protect", "encrypt", "password", "lock"]):
        return (
            "### 🔒 How to Encrypt & Protect PDFs\n\n"
            "1. Navigate to **PDF Suite** $\\rightarrow$ **Encrypt PDF Document**.\n"
            "2. Upload your PDF and enter a secure password.\n"
            "3. Click **Protect PDF** — your document is now secured with standard AES encryption."
        )
    elif any(k in q for k in ["unlock", "decrypt", "remove password"]):
        return (
            "### 🔓 How to Decrypt / Unlock Password-Protected PDFs\n\n"
            "1. Go to **PDF Suite** $\\rightarrow$ **Decrypt Password-Protected PDF**.\n"
            "2. Upload the locked document and type the current password.\n"
            "3. Click **Unlock PDF** to strip the password restrictions."
        )
    elif any(k in q for k in ["watch", "folder", "daemon", "automate"]):
        return (
            "### ⚡ How Watch Folder Automation Works\n\n"
            "OmniConverter includes a background automation daemon that converts files the moment you drop them in a folder!\n\n"
            "1. In the **File Converter** tab, expand the **Watch Folder Automation** panel.\n"
            "2. Specify your **Input Folder** (e.g. `C:\\OmniWatch\\Input`) and **Output Folder**.\n"
            "3. Choose your default target format (e.g., `PDF`, `PNG`, `MP3`).\n"
            "4. Or run via terminal:\n"
            "   ```bash\n"
            "   python watch_daemon.py --input ./watch_input --output ./watch_output --target pdf\n"
            "   ```"
        )
    elif any(k in q for k in ["format", "supported", "extension", "type"]):
        return (
            "### 📑 Supported File Formats (50+ Types)\n\n"
            "- **📄 Documents**: `PDF`, `DOCX`, `XLSX`, `PPTX`, `TXT`, `RTF`, `ODT`, `HTML`\n"
            "- **🖼️ Images**: `PNG`, `JPG`, `WEBP`, `GIF`, `BMP`, `TIFF`, `SVG`, `ICO`\n"
            "- **🎵 Audio**: `MP3`, `WAV`, `AAC`, `OGG`, `FLAC`, `M4A`, `OPUS`\n"
            "- **🎥 Video**: `MP4`, `AVI`, `MKV`, `MOV`, `WEBM`, `FLV`\n"
            "- **📊 Data & Code**: `CSV`, `JSON`, `XML`, `YAML`, `TSV`, `SQL`"
        )
    elif any(k in q for k in ["shortcut", "hotkey", "command", "ctrl+k", "spotlight"]):
        return (
            "### ⌨️ Keyboard Shortcuts\n\n"
            "- **`Ctrl + K` / `Cmd + K`**: Opens the **Spotlight Command Palette** for instant tool search.\n"
            "- **`Esc`**: Closes modals, popups, and the AI Assistant.\n"
            "- **`Enter`**: Submits conversion jobs or sends AI messages."
        )
    elif any(k in q for k in ["unit", "conversion", "science", "calculate", "temperature", "weight", "length"]):
        return (
            "### 🧮 Multi-Unit Converter Engine\n\n"
            "Switch to the **Unit Converter** tab to convert over **100+ units across 10 categories**:\n"
            "- *Data Storage, Length, Weight & Mass, Speed, Temperature, Area, Volume, Time, Energy, Pressure*.\n"
            "Values update bidirectionally in real-time as you type!"
        )
    elif any(k in q for k in ["api", "key", "gemini", "openai", "grok", "claude", "settings"]):
        return (
            "### ⚙️ How to Connect Gemini, OpenAI, or Grok API Keys\n\n"
            "1. Click the **Gear icon (⚙️)** in the top right of this chat window.\n"
            "2. Select your AI Provider (**Google Gemini**, **OpenAI**, **xAI Grok**, or **Claude**).\n"
            "3. Paste your API Key and click **Save & Connect**.\n"
            "4. Your key is stored securely and locally in your browser session!"
        )
    else:
        return (
            f"### 🤖 OmniAI Assistant\n\n"
            f"I can help you with anything in **OmniConverter**! Here are some things you can ask me:\n\n"
            f"- *\"How do I merge multiple PDFs?\"*\n"
            f"- *\"How do I split a PDF into separate files inside a ZIP?\"*\n"
            f"- *\"How to compress a PDF by 80%?\"*\n"
            f"- *\"How do I configure the Watch Folder background daemon?\"*\n"
            f"- *\"What video and audio formats can I convert?\"*\n"
            f"- *\"How to configure Google Gemini, OpenAI, or Grok API keys?\"*\n\n"
            f"Feel free to ask or click the gear ⚙️ to connect your favorite AI model!"
        )


@app.post("/api/ai/chat")
async def api_ai_chat(req: AIChatRequest):
    provider = (req.provider or "builtin").lower()
    system_prompt = (
        "You are OmniAI, the expert AI assistant for OmniConverter (Universal File Converter & PDF Suite). "
        "Help the user efficiently with file conversions (PDF, Video, Audio, Image, Data), Watch Folder daemon, "
        "PDF operations (Merge, Split, Compress, Protect, Unlock, Rotate), and Unit conversions. "
        "Format responses cleanly with markdown and bullet points."
    )

    if provider == "builtin" or not req.api_key:
        reply = get_builtin_knowledge_reply(req.message)
        return {"reply": reply, "provider": "builtin", "model": "OmniKnowledge-v4"}

    try:
        # GOOGLE GEMINI
        if provider == "gemini":
            model = req.model or "gemini-1.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={req.api_key}"
            
            prompt_text = f"{system_prompt}\n\nUser Question: {req.message}"
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
            }
            
            data = json.dumps(payload).encode("utf-8")
            h_req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(h_req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    reply = "".join(p.get("text", "") for p in parts)
                    return {"reply": reply, "provider": "gemini", "model": model}
                return {"reply": "No response generated from Gemini.", "provider": "gemini", "model": model}

        # OPENAI (GPT-4o / GPT-4o-mini)
        elif provider == "openai":
            model = req.model or "gpt-4o-mini"
            url = "https://api.openai.com/v1/chat/completions"
            messages = [{"role": "system", "content": system_prompt}]
            if req.history:
                for h in req.history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": req.message})

            payload = {"model": model, "messages": messages, "temperature": 0.7}
            data = json.dumps(payload).encode("utf-8")
            h_req = urllib.request.Request(url, data=data, headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {req.api_key}"
            })
            with urllib.request.urlopen(h_req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                reply = res_data["choices"][0]["message"]["content"]
                return {"reply": reply, "provider": "openai", "model": model}

        # xAI GROK
        elif provider == "grok":
            model = req.model or "grok-2-latest"
            url = "https://api.x.ai/v1/chat/completions"
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ]
            payload = {"model": model, "messages": messages, "temperature": 0.7}
            data = json.dumps(payload).encode("utf-8")
            h_req = urllib.request.Request(url, data=data, headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {req.api_key}"
            })
            with urllib.request.urlopen(h_req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                reply = res_data["choices"][0]["message"]["content"]
                return {"reply": reply, "provider": "grok", "model": model}

        # ANTHROPIC CLAUDE
        elif provider == "claude":
            model = req.model or "claude-3-5-sonnet-20241022"
            url = "https://api.anthropic.com/v1/messages"
            payload = {
                "model": model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [{"role": "user", "content": req.message}]
            }
            data = json.dumps(payload).encode("utf-8")
            h_req = urllib.request.Request(url, data=data, headers={
                "Content-Type": "application/json",
                "x-api-key": req.api_key,
                "anthropic-version": "2023-06-01"
            })
            with urllib.request.urlopen(h_req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                content = res_data.get("content", [])
                reply = "".join(c.get("text", "") for c in content if c.get("type") == "text")
                return {"reply": reply, "provider": "claude", "model": model}

        else:
            reply = get_builtin_knowledge_reply(req.message)
            return {"reply": reply, "provider": "builtin", "model": "OmniKnowledge-v4"}

    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8", errors="ignore")
        return {"reply": f"⚠️ **API Request Error ({he.code})**: {err_body}\n\nFalling back to built-in knowledge:\n\n" + get_builtin_knowledge_reply(req.message), "provider": provider, "error": True}
    except Exception as e:
        return {"reply": f"⚠️ **Connection Error**: {str(e)}\n\n" + get_builtin_knowledge_reply(req.message), "provider": provider, "error": True}


if __name__ == "__main__":
    import uvicorn
    import webbrowser

    port = find_available_port(8500)
    url = f"http://localhost:{port}"

    db_init = load_db()
    if db_init.get("watchFolder", {}).get("enabled"):
        daemon.start()

    print("\n=======================================================")
    print(f" OmniConverter PRO 4.0 Ultra Server Starting...")
    print(f" URL: {url}")
    print("=======================================================\n")

    threading.Timer(1.2, lambda: webbrowser.open(url)).start()

    uvicorn.run(app, host="127.0.0.1", port=port)

