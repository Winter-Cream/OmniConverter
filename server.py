"""
OmniConverter PRO 4.2.0 - FastAPI Backend Server
Provides high-performance REST APIs for single & batch conversions, Watch Folder automation,
statistics tracking, AI tool proxies, and serving the modern web frontend.
"""

import os
import re
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
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from converter_engine import converter_engine, check_ffmpeg
from watch_daemon import WatchFolderDaemon

# ─── Security constants ───────────────────────────────────────────────────────
MAX_UPLOAD_BYTES   = 200 * 1024 * 1024   # 200 MB per file
MAX_BATCH_FILES    = 50                   # max files per batch request
MAX_TTS_CHARS      = 2000                 # max chars for TTS synthesis

ALLOWED_EXTENSIONS = {
    # Documents
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt",
    ".txt", ".rtf", ".odt", ".ods", ".odp", ".html", ".htm",
    # Images
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff",
    ".tif", ".svg", ".ico", ".heic", ".heif",
    # Audio
    ".mp3", ".wav", ".aac", ".ogg", ".flac", ".m4a", ".opus", ".wma",
    # Video
    ".mp4", ".avi", ".mkv", ".mov", ".webm", ".flv", ".wmv", ".m4v",
    # Data / Code
    ".csv", ".json", ".xml", ".yaml", ".yml", ".tsv", ".sql", ".md",
    ".py", ".js", ".ts", ".java", ".c", ".cpp", ".rs", ".go",
}

# Localhost-only origins (desktop app)
_LOCALHOST_ORIGINS = [
    "http://localhost:8500", "http://127.0.0.1:8500",
    "http://localhost:8501", "http://127.0.0.1:8501",
    "http://localhost:5173", "http://127.0.0.1:5173",
]

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ─── App ─────────────────────────────────────────────────────────────────────
ENV = os.getenv("OMNI_ENV", "production")
app = FastAPI(
    title="OmniConverter PRO 4.2.0 Server",
    description="Python-powered backend conversion engine & automation daemon",
    version="4.2.0",
    docs_url="/docs" if ENV == "dev" else None,
    redoc_url="/redoc" if ENV == "dev" else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Security Headers middleware ─────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"]         = "SAMEORIGIN"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"]        = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ─── CORS locked to localhost only ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=_LOCALHOST_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
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
if FRONTEND_DIST.exists():
    app.mount("/dist", StaticFiles(directory=str(FRONTEND_DIST)), name="dist_root")

# Global thread lock for database access
DB_LOCK = threading.Lock()

# Instantiate Watch Folder Daemon
daemon = WatchFolderDaemon(DATA_FILE, db_lock=DB_LOCK)

# ─── Security helpers ─────────────────────────────────────────────────────────
def sanitize_filename(name: str) -> str:
    """Strip path separators, non-safe characters, and cap length."""
    name = Path(name).name
    name = re.sub(r'[^\w\-.() ]', '_', name)
    return name[:128] or "upload"

def validate_extension(filename: str):
    """Raise 415 if file extension is not in the allowed set."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type '{ext}'. Upload a supported format.")

def validate_target_format(target_format: str):
    """Raise 400 if target_format is not a recognised conversion target."""
    fmt = target_format.strip().lower()
    if not fmt or not re.match(r'^[a-z0-9]{1,10}$', fmt):
        raise HTTPException(status_code=400, detail=f"Invalid target format: '{target_format}'")
    return fmt

def guard_watch_path(raw: str) -> Path:
    """Resolve a user-selected absolute local path for the watch daemon."""
    value = (raw or "").strip()
    if not value:
        raise HTTPException(400, "Watch folder paths cannot be empty.")
    try:
        candidate = Path(value).expanduser()
        if not candidate.is_absolute():
            raise HTTPException(400, "Watch folder paths must be absolute paths.")
        resolved = candidate.resolve()
    except HTTPException:
        raise
    except (OSError, RuntimeError, ValueError) as exc:
        raise HTTPException(400, f"Invalid watch folder path: {exc}")
    if resolved.exists() and not resolved.is_dir():
        raise HTTPException(400, f"Watch folder path is not a directory: {resolved}")
    return resolved

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
                db = json.load(f)
            # Basic schema validation / coercion
            db["filesConverted"]  = int(db.get("filesConverted", 0))
            db["bytesProcessed"]  = int(db.get("bytesProcessed", 0))
            db["timeSavedSeconds"]= int(db.get("timeSavedSeconds", 0))
            db["xp"]              = int(db.get("xp", 0))
            db["level"]           = int(db.get("level", 1))
            db["streak"]          = int(db.get("streak", 1))
            db["history"]         = db.get("history", []) if isinstance(db.get("history"), list) else []
            return db
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
    if react_index.exists():
        return FileResponse(react_index, media_type="text/html", headers=headers)
    elif index_path.exists():
        return FileResponse(index_path, media_type="text/html", headers=headers)
    return {"message": "OmniConverter Server running."}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Serves official OmniConverter favicon."""
    fav_dist = FRONTEND_DIST / "favicon.ico"
    fav_static = STATIC_DIR / "favicon.ico"
    if fav_dist.exists():
        return FileResponse(fav_dist, media_type="image/x-icon")
    elif fav_static.exists():
        return FileResponse(fav_static, media_type="image/x-icon")
    return Response(status_code=204)

@app.get("/logo.png", include_in_schema=False)
async def logo_png():
    """Serves official OmniConverter high-res logo."""
    logo_dist = FRONTEND_DIST / "logo.png"
    logo_static = STATIC_DIR / "logo.png"
    if logo_dist.exists():
        return FileResponse(logo_dist, media_type="image/png")
    elif logo_static.exists():
        return FileResponse(logo_static, media_type="image/png")
    return Response(status_code=404)

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
@limiter.limit("30/minute")
async def convert_single_file(
    request: Request,
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
    validate_extension(file.filename)
    target_format = validate_target_format(target_format)

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
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum upload size is 200 MB.")

    safe_name = sanitize_filename(file.filename)
    res = converter_engine.convert_file(content, safe_name, target_format, opt_dict)

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
@limiter.limit("10/minute")
async def convert_batch_files(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form("{}")
):
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(400, f"Maximum {MAX_BATCH_FILES} files per batch request.")
    target_format = validate_target_format(target_format)

    try:
        opt_dict = json.loads(options) if options else {}
    except Exception:
        opt_dict = {}

    file_tuples = []
    total_bytes = 0
    for f in files:
        validate_extension(f.filename)
        data = await f.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, f"File '{sanitize_filename(f.filename)}' exceeds 200 MB limit.")
        total_bytes += len(data)
        file_tuples.append((sanitize_filename(f.filename), data))

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
    safe_in  = guard_watch_path(path)
    safe_out = guard_watch_path(output_path)
    target_format = validate_target_format(target_format)

    if enabled and safe_in == safe_out:
        raise HTTPException(400, "Input and output folders must be different.")
    if enabled:
        try:
            safe_in.mkdir(parents=True, exist_ok=True)
            safe_out.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise HTTPException(400, f"Could not create the watch folders: {exc}")

    db = load_db()
    db["watchFolder"] = {
        "enabled": enabled,
        "path": str(safe_in),
        "output_path": str(safe_out),
        "target_format": target_format
    }
    save_db(db)

    if enabled:
        daemon.start()
    else:
        daemon.stop()

    return {"status": "success", "watchFolder": db["watchFolder"]}

@app.post("/api/ai/tts")
@limiter.limit("20/minute")
async def ai_tts_synthesizer(request: Request, text: str = Form(...), voice: str = Form("neutral")):
    if len(text) > MAX_TTS_CHARS:
        raise HTTPException(400, f"Text too long. Maximum {MAX_TTS_CHARS} characters for TTS.")
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
    endpoint: Optional[str] = None
    mode: Optional[str] = "universal"
    history: Optional[List[Dict[str, str]]] = []


def get_builtin_knowledge_reply(query: str, mode: str = "universal") -> str:
    q = query.lower()

    # 1. SPECIFIC CODING, REGEX & SCRIPTING (Highest specificity)
    if any(k in q for k in ["python", "script", "batch convert script", "pil", "pypdf", "pandas"]):
        return (
            "### 💻 Python Automation Recipes for File Tasks\n\n"
            "Here is a production-ready Python script to batch convert images in a directory using `Pillow`:\n\n"
            "```python\n"
            "from PIL import Image\n"
            "from pathlib import Path\n\n"
            "def batch_convert_images(input_dir, output_dir, target_ext='webp', quality=85):\n"
            "    in_path, out_path = Path(input_dir), Path(output_dir)\n"
            "    out_path.mkdir(parents=True, exist_ok=True)\n"
            "    \n"
            "    for img_file in in_path.glob('*.*'):\n"
            "        if img_file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:\n"
            "            with Image.open(img_file) as im:\n"
            "                dest = out_path / f\"{img_file.stem}.{target_ext}\"\n"
            "                im.save(dest, quality=quality, optimize=True)\n"
            "                print(f\"Converted: {img_file.name} -> {dest.name}\")\n\n"
            "# Usage\n"
            "batch_convert_images('./input_photos', './output_webp', 'webp', quality=85)\n"
            "```\n\n"
            "*Need a script for PDFs, ffmpeg, or pandas? Just ask OmniAI for the exact code!*"
        )
    elif any(k in q for k in ["regex", "regular expression", "pattern"]):
        return (
            "### 🧩 Essential Regular Expression (Regex) Patterns\n\n"
            "- **Email Address**:\n"
            "  `^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$`\n"
            "- **URL (HTTP/HTTPS)**:\n"
            "  `https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)`\n"
            "- **Phone Number (International)**:\n"
            "  `^\\+?[1-9]\\d{1,14}$`\n"
            "- **Date (YYYY-MM-DD)**:\n"
            "  `^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$`\n"
            "- **Slug / Filename Safe**:\n"
            "  `^[a-z0-9]+(?:-[a-z0-9]+)*$`\n\n"
            "*Want a custom regex for specific text or data extraction? Just provide sample input!*"
        )
    elif any(k in q for k in ["ffmpeg", "one-liner", "command recipe"]):
        return (
            "### 🎬 Top FFmpeg Terminal One-Liners\n\n"
            "1. **Compress Video with High Quality (CRF 23)**:\n"
            "   `ffmpeg -i input.mp4 -vcodec libx264 -crf 23 -preset slow output.mp4`\n\n"
            "2. **Extract Audio (MP3 320kbps) from Video**:\n"
            "   `ffmpeg -i video.mp4 -vn -acodec libmp3lame -b:a 320k audio.mp3`\n\n"
            "3. **Cut/Trim Video without Re-encoding (Instant)**:\n"
            "   `ffmpeg -ss 00:01:30 -to 00:03:45 -i input.mp4 -c copy output.mp4`\n\n"
            "4. **Convert MP4 to WebM for Fast Web Loading**:\n"
            "   `ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 1500k -c:a libopus output.webm`\n\n"
            "5. **Resize Video to 1080p (Keep Aspect Ratio)**:\n"
            "   `ffmpeg -i input.mp4 -vf scale=1920:-2 -c:a copy output_1080p.mp4`"
        )

    # 2. TECHNICAL CALCULATIONS & UNITS
    elif any(k in q for k in ["bitrate formula", "aspect ratio", "calculate", "formula", "calculator", "kib", "storage units", "gigabytes to megabytes", "temperature conversion"]):
        return (
            "### 🧮 Multi-Unit Converter & Technical Calculations\n\n"
            "- **Data Storage Units**:\n"
            "  - $1\\text{ KB} = 1,000\\text{ Bytes}$ (Decimal)\n"
            "  - $1\\text{ KiB} = 1,024\\text{ Bytes}$ (Binary Kibibyte)\n"
            "  - $1\\text{ GB} = 1,024\\text{ MB} = 1,048,576\\text{ KB}$\n\n"
            "- **Video Bitrate to File Size Formula**:\n"
            "  $$\\text{Size (MB)} = \\frac{\\text{Bitrate (kbps)} \\times \\text{Duration (seconds)}}{8 \\times 1024}$$\n"
            "  *Example: A 10-minute video at 5,000 kbps = $\\approx 366\\text{ MB}$*.\n\n"
            "- **Common Video Resolutions (16:9)**:\n"
            "  - 4K UHD: `3840 x 2160`\n"
            "  - 1440p QHD: `2560 x 1440`\n"
            "  - 1080p FHD: `1920 x 1080`\n"
            "  - 720p HD: `1280 x 720`\n\n"
            "[ACTION:OPEN_UNITS|🧮 Open Interactive Unit Converter]"
        )

    # 3. VIDEO & MEDIA SPECIFICS
    elif any(k in q for k in ["video", "mp4", "mkv", "webm", "avi", "mov", "codec", "h264", "hevc", "discord", "instagram", "tiktok"]):
        return (
            "### 🎥 Video Conversion & Encoding Guide\n\n"
            "OmniConverter supports full hardware-accelerated video encoding for all major formats:\n"
            "- **Formats Supported**: `MP4`, `MKV`, `WEBM`, `AVI`, `MOV`, `FLV`, `WMV`, `M4V`\n"
            "- **Codecs**: H.264 (universal compatibility), H.265/HEVC (50% smaller files), VP9 / AV1 (web standard)\n\n"
            "**Best Practices & Presets:**\n"
            "- **Discord Upload (<25MB / <10MB)**: Convert to `MP4` with video quality `720p` or `480p`, audio bitrate `96k`.\n"
            "- **Instagram Reels & TikTok**: Format `MP4`, aspect ratio `9:16` (1080x1920), 30 or 60 fps.\n"
            "- **Web Embedding**: Convert to `WEBM` (VP9) for ultra-lightweight browser loading.\n"
            "- **Strip Audio Track**: Toggle *Remove Audio* in conversion options to produce silent video.\n\n"
            "[ACTION:OPEN_CONVERTER|🚀 Go to Video Converter]"
        )
    elif any(k in q for k in ["audio", "mp3", "wav", "flac", "aac", "m4a", "opus", "extract audio", "strip audio"]):
        return (
            "### 🎵 Audio Extraction & Conversion Guide\n\n"
            "- **Extract Audio from Video**: Drop any `MP4`, `MKV`, or `MOV` file into OmniConverter and select `MP3`, `AAC`, or `WAV` as target format!\n"
            "- **Bitrate Recommendations**:\n"
            "  - `320 kbps`: Audiophile / Studio quality (highest fidelity for music)\n"
            "  - `192 kbps`: Optimal balance for music & podcasts (high quality, half the size of 320k)\n"
            "  - `128 kbps`: Ideal for voice recordings, lectures, and compact file storage\n"
            "- **Lossless vs Lossy**:\n"
            "  - Use `FLAC` or `WAV` for lossless archival\n"
            "  - Use `MP3`, `M4A`, or `OPUS` for broad playback across mobile and car stereos\n\n"
            "[ACTION:OPEN_CONVERTER|🎵 Go to Audio Converter]"
        )

    # 4. IMAGES & GRAPHICS
    elif any(k in q for k in ["image", "png", "webp", "jpg", "jpeg", "svg", "ico", "favicon", "transparent"]):
        return (
            "### 🖼️ Image Conversion & Optimization\n\n"
            "- **PNG $\\rightarrow$ WEBP**: Reduces file size by 30–70% while keeping full alpha transparency!\n"
            "- **Favicon Creation**: Convert any image to `ICO` to generate website and desktop icons with multi-resolution support (16x16, 32x32, 48x48, 64x64).\n"
            "- **Lossy vs Lossless Quality**: Use the Quality slider (e.g. 85%) for WebP/JPEG to cut size in half with zero noticeable difference.\n"
            "- **Resize Dimensions**: Specify exact Width & Height in conversion options to batch scale graphics.\n\n"
            "[ACTION:OPEN_CONVERTER|🖼️ Go to Image Converter]"
        )

    # 5. DATA FORMATS
    elif any(k in q for k in ["data", "json", "csv", "yaml", "xml", "sql", "excel", "xlsx"]):
        return (
            "### 📊 Data & Structured Format Conversion\n\n"
            "OmniConverter transforms structured data formats with schema preservation:\n"
            "- **CSV $\\leftrightarrow$ JSON**: Convert flat tabular CSV into structured JSON arrays and vice versa.\n"
            "- **JSON $\\leftrightarrow$ YAML**: Clean serialization for Kubernetes configs, GitHub Actions, and app settings.\n"
            "- **XLSX $\\rightarrow$ CSV / PDF**: Fast spreadsheet extraction.\n"
            "- **XML $\\rightarrow$ JSON**: Parse hierarchical tags into modern key-value dictionaries.\n\n"
            "[ACTION:OPEN_CONVERTER|📊 Open Data Converter]"
        )

    # 6. PDF SUITE
    elif any(k in q for k in ["merge", "combine"]):
        return (
            "### 📄 How to Merge PDFs in OmniConverter\n\n"
            "1. Switch to the **PDF Suite** tab and select the **Merge PDFs** tool.\n"
            "2. Drag & drop or select multiple PDF files.\n"
            "3. Use the reorder buttons to arrange files in your desired page sequence.\n"
            "4. Click **Merge PDFs** — your unified PDF is generated 100% locally with zero cloud uploads!\n\n"
            "[ACTION:OPEN_MERGE|🚀 Open PDF Merge Tool]\n\n"
            "*Tip: Merging is completely lossless and retains original bookmarks and hyperlinks.*"
        )
    elif any(k in q for k in ["split", "extract page"]):
        return (
            "### ✂️ How to Split & Extract PDF Pages\n\n"
            "1. Open the **PDF Suite** tab and locate **Split & Extract Pages**.\n"
            "2. Upload your PDF document and define your extraction mode:\n"
            "   - **Custom Range**: e.g., `1-3, 5, 8-12` (comma-separated)\n"
            "   - **Even / Odd Pages**: extracts only even or odd numbered pages\n"
            "3. Choose your output mode:\n"
            "   - *Single Combined PDF*: combines extracted pages into one clean document\n"
            "   - *ZIP Archive*: saves each selected page into individual PDF files inside a `.zip` archive\n"
            "4. Click **Split PDF** to download instantly.\n\n"
            "[ACTION:OPEN_SPLIT|✂️ Open PDF Split Tool]"
        )
    elif any(k in q for k in ["compress", "reduce size", "smaller", "shrink"]):
        return (
            "### 🗜️ How to Compress PDFs & Reduce File Size\n\n"
            "1. Navigate to **PDF Suite** $\\rightarrow$ **Compress PDF Size**.\n"
            "2. Select the optimal compression preset for your needs:\n"
            "   - **Low**: Minimal quality loss, keeps high DPI (15–30% size reduction)\n"
            "   - **Medium (Recommended)**: Balanced optimization for email & web (40–60% reduction)\n"
            "   - **High**: Maximum compression for tight upload limits (up to 85–90% reduction)\n"
            "3. Upload your PDF and click **Compress PDF**.\n\n"
            "[ACTION:OPEN_COMPRESS|🗜️ Open PDF Compress Tool]\n\n"
            "*Formula: OmniConverter strips unreferenced objects, flattens font streams, and compresses image assets.*"
        )
    elif any(k in q for k in ["protect", "encrypt", "password", "lock"]):
        return (
            "### 🔒 How to Encrypt & Password-Protect PDFs\n\n"
            "1. Go to **PDF Suite** $\\rightarrow$ **Encrypt PDF Document**.\n"
            "2. Upload the document you wish to secure.\n"
            "3. Enter a strong password.\n"
            "4. Click **Protect PDF** — secured instantly with standard AES encryption.\n\n"
            "[ACTION:OPEN_PROTECT|🔒 Open PDF Encryption Tool]"
        )
    elif any(k in q for k in ["unlock", "decrypt", "remove password"]):
        return (
            "### 🔓 How to Decrypt / Remove Password from PDFs\n\n"
            "1. Switch to **PDF Suite** $\\rightarrow$ **Decrypt Password-Protected PDF**.\n"
            "2. Upload your locked PDF file.\n"
            "3. Type the existing password to authorize decryption.\n"
            "4. Click **Unlock PDF** to strip the password lock and export a clean document.\n\n"
            "[ACTION:OPEN_UNLOCK|🔓 Open PDF Decrypt Tool]"
        )
    elif any(k in q for k in ["rotate", "turn page", "orientation"]):
        return (
            "### 🔄 How to Rotate PDF Pages\n\n"
            "1. Go to **PDF Suite** $\\rightarrow$ **Rotate PDF Pages**.\n"
            "2. Upload your PDF and choose rotation angle: **90° Clockwise**, **180° Inverted**, or **270° Counter-Clockwise**.\n"
            "3. Choose target pages: `all`, `even`, `odd`, or a custom range (e.g. `2, 4-6`).\n"
            "4. Click **Rotate PDF**.\n\n"
            "[ACTION:OPEN_ROTATE|🔄 Open PDF Rotate Tool]"
        )
    elif any(k in q for k in ["ocr", "scan", "text recognition", "tesseract", "extract text"]):
        return (
            "### 🔍 OCR Studio & Text Recognition\n\n"
            "OmniConverter includes a built-in OCR (Optical Character Recognition) engine that extracts editable text from images and scanned PDFs:\n\n"
            "1. In **PDF Suite**, scroll to **OCR Text Recognition**.\n"
            "2. Upload any scanned PDF or image (`PNG`, `JPG`, `TIFF`, `WEBP`).\n"
            "3. View extracted text live with page breakdown, confidence scores, and download as `.txt`!\n\n"
            "[ACTION:OPEN_OCR|🔍 Open OCR Studio]"
        )

    # 7. WATCH FOLDER AUTOMATION
    elif any(k in q for k in ["watch", "folder", "daemon", "automate", "background"]):
        return (
            "### ⚡ Watch Folder Background Automation\n\n"
            "OmniConverter can continuously monitor a local folder on your computer and automatically convert new incoming files:\n\n"
            "1. In the **File Converter** tab, expand the **Watch Folder Automation** card.\n"
            "2. Set **Input Folder** (e.g., `C:\\Users\\User\\Downloads\\Incoming`).\n"
            "3. Set **Output Folder** and default **Target Format** (e.g., `PDF`, `PNG`, `MP3`).\n"
            "4. Click **Save & Enable Daemon**.\n\n"
            "**Terminal Command Line Usage:**\n"
            "```bash\n"
            "python watch_daemon.py --input C:\\OmniWatch\\In --output C:\\OmniWatch\\Out --target pdf\n"
            "```\n\n"
            "[ACTION:OPEN_WATCH|⚡ Open Watch Folder Setup]"
        )

    # 8. GENERAL WRITING & TRANSLATION
    elif any(k in q for k in ["write", "email", "draft", "summarize", "proofread", "letter"]):
        return (
            "### ✍️ Writing & Editing Assistant\n\n"
            "OmniAI can help you draft, polish, and restructure documents:\n"
            "- **Professional Email Templates**: Business inquiries, follow-ups, project proposals, bug reports\n"
            "- **Summarization**: Turn long reports or PDF contents into clean executive bullet points\n"
            "- **Tone Adjustment**: Shift text between *Formal*, *Concise*, *Persuasive*, or *Technical*\n\n"
            "*Paste any text here and tell me what you want to change (e.g., 'Make this email more concise' or 'Summarize this in 3 bullets')!*"
        )
    elif any(k in q for k in ["translate", "translation", "spanish", "french", "german", "hindi", "japanese", "chinese"]):
        return (
            "### 🌐 Multilingual Translation Assistant\n\n"
            "OmniAI translates text across 20+ languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, and Hindi.\n\n"
            "**Quick Language Example (Greetings & File Terms):**\n"
            "| English | Spanish | French | German | Hindi |\n"
            "|---|---|---|---|---|\n"
            "| File Converter | Convertidor de Archivos | Convertisseur de Fichiers | Datei-Konverter | फ़ाइल कनवर्टर |\n"
            "| Merge PDFs | Unir PDFs | Fusionner les PDF | PDFs zusammenführen | पीडीएफ मर्ज करें |\n"
            "| Compress | Comprimir | Compresser | Komprimieren | संपीड़ित करें |\n\n"
            "*Simply type: `Translate this to [Language]: [your text]` and OmniAI will handle it!*"
        )

    # 9. GENERAL UNIT TAB
    elif any(k in q for k in ["unit", "conversion", "units"]):
        return (
            "### 🧮 Multi-Unit Converter & Technical Calculations\n\n"
            "Switch to the **Unit Converter** tab to convert over **100+ units across 10 categories**:\n"
            "- *Data Storage, Length, Weight & Mass, Speed, Temperature, Area, Volume, Time, Energy, Pressure*.\n"
            "Values update bidirectionally in real-time as you type!\n\n"
            "[ACTION:OPEN_UNITS|🧮 Open Interactive Unit Converter]"
        )

    # 10. SHORTCUTS & NAVIGATION
    elif any(k in q for k in ["shortcut", "hotkey", "command", "ctrl+k", "spotlight"]):
        return (
            "### ⌨️ Desktop Keyboard Shortcuts\n\n"
            "- **`Ctrl + K` / `Cmd + K`**: Opens the **Spotlight Command Palette** for instant tool search.\n"
            "- **`Alt + A`**: Toggles the **OmniAI Assistant** window.\n"
            "- **`Esc`**: Closes active modals, search panels, and the chat window.\n"
            "- **`Enter`**: Executes conversion jobs or sends AI messages.\n\n"
            "[ACTION:OPEN_SPOTLIGHT|🔍 Open Spotlight Palette]"
        )

    # 11. API KEYS & PROVIDERS
    elif any(k in q for k in ["api", "key", "gemini", "openai", "grok", "claude", "ollama", "settings"]):
        return (
            "### ⚙️ How to Connect AI Providers in OmniAI\n\n"
            "OmniAI supports both **Zero-Configuration Built-in AI** and direct connections to frontier models:\n\n"
            "1. Click the **Gear icon (⚙️)** in the top right of this chat window.\n"
            "2. Select your desired AI provider:\n"
            "   - **⚡ Built-in Engine**: Works instantly offline and online with zero setup!\n"
            "   - **🦙 Ollama (100% Local & Private)**: Connects to your local Ollama server (`http://localhost:11434`) for Llama 3, DeepSeek, or Mistral.\n"
            "   - **🌟 Google Gemini**: Gemini 2.0 Flash / 1.5 Flash.\n"
            "   - **🤖 OpenAI**: GPT-4o / GPT-4o-mini.\n"
            "   - **🧠 Anthropic Claude**: Claude 3.5 Sonnet.\n"
            "   - **⚡ xAI Grok**: Grok-2.\n"
            "   - **🌐 Custom / OpenRouter**: Any OpenAI-compatible endpoint.\n"
            "3. Paste your API key (if required) and click **Save Configuration**."
        )

    # 12. SUPPORTED FORMATS LIST
    elif any(k in q for k in ["format", "supported", "extension", "type"]):
        return (
            "### 📑 Supported File Formats (50+ Types)\n\n"
            "- **📄 Documents**: `PDF`, `DOCX`, `XLSX`, `PPTX`, `TXT`, `RTF`, `ODT`, `HTML`\n"
            "- **🖼️ Images**: `PNG`, `JPG`, `WEBP`, `GIF`, `BMP`, `TIFF`, `SVG`, `ICO`\n"
            "- **🎵 Audio**: `MP3`, `WAV`, `AAC`, `OGG`, `FLAC`, `M4A`, `OPUS`\n"
            "- **🎥 Video**: `MP4`, `AVI`, `MKV`, `MOV`, `WEBM`, `FLV`\n"
            "- **📊 Data & Code**: `CSV`, `JSON`, `XML`, `YAML`, `TSV`, `SQL`\n\n"
            "[ACTION:OPEN_CONVERTER|🚀 Go to File Converter]"
        )

    # 13. GENERAL CONVERSATIONAL / GREETING FALLBACK
    else:
        return (
            "### 🌟 OmniAI Universal Copilot\n\n"
            "I am **OmniAI**, your universal intelligent assistant. I can help you with anything across your workflow:\n\n"
            "- **📄 PDF Suite**: Merge, split, compress, password-protect, rotate, or OCR extract\n"
            "- **🎥 Media Conversion**: Compress video, extract audio, convert formats, match bitrates\n"
            "- **💻 Coding & Terminal**: Python batch scripts, FFmpeg recipes, shell scripts, regex generator\n"
            "- **✍️ Writing & Translation**: Polish emails, summarize documents, translate text in 20+ languages\n"
            "- **🧮 Calculations**: Unit conversions, file size calculators, video bitrate math\n"
            "- **⚡ Automation**: Background Watch Folder setup and daemon scripts\n\n"
            "*Ask any question or click a quick action below to get started!*"
        )


@app.post("/api/ai/chat")
@limiter.limit("30/minute")
async def api_ai_chat(req: AIChatRequest, request: Request):
    provider = (req.provider or "builtin").lower()
    system_prompt = (
        "You are OmniAI, the supreme universal AI copilot built into OmniConverter. "
        "You help users with everything: file conversions (PDF, Video, Audio, Image, Data), "
        "programming & scripting (Python, JavaScript, Bash, SQL, Regex, FFmpeg), "
        "writing, summarization, multilingual translation, mathematics, technical troubleshooting, "
        "and general problem solving. "
        "Always provide structured, clear, and proactive answers with markdown and code snippets where helpful."
    )

    # BUILT-IN INTELLIGENCE (Instant & Offline)
    if provider == "builtin" or not req.api_key:
        # If user explicitly configured Ollama with no key needed
        if provider == "ollama":
            pass  # handled in Ollama block below
        else:
            # Check if query matches our extensive knowledge base
            reply = get_builtin_knowledge_reply(req.message, req.mode or "universal")
            return {"reply": reply, "provider": "builtin", "model": "OmniKnowledge-v5"}

    try:
        # LOCAL OLLAMA (100% Private & Offline)
        if provider == "ollama":
            model = req.model or "llama3.2"
            base_url = (req.endpoint or "http://localhost:11434").rstrip("/")
            url = f"{base_url}/api/chat"
            messages = [{"role": "system", "content": system_prompt}]
            if req.history:
                for h in req.history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": req.message})

            payload = {"model": model, "messages": messages, "stream": False}
            data = json.dumps(payload).encode("utf-8")
            h_req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(h_req, timeout=45) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                reply = res_data.get("message", {}).get("content", "No response from Ollama.")
                return {"reply": reply, "provider": "ollama", "model": model}

        # GOOGLE GEMINI
        elif provider == "gemini":
            model = req.model or "gemini-2.0-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={req.api_key}"
            prompt_text = f"{system_prompt}\n\nUser Question: {req.message}"
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
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

        # ANTHROPIC CLAUDE
        elif provider == "claude":
            model = req.model or "claude-3-5-sonnet-20241022"
            url = "https://api.anthropic.com/v1/messages"
            payload = {
                "model": model,
                "max_tokens": 2048,
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

        # CUSTOM / OPENROUTER (OpenAI-compatible)
        elif provider in ["custom", "openrouter"]:
            model = req.model or "meta-llama/llama-3.3-70b-instruct"
            url = req.endpoint or "https://openrouter.ai/api/v1/chat/completions"
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
                return {"reply": reply, "provider": provider, "model": model}

        else:
            reply = get_builtin_knowledge_reply(req.message, req.mode or "universal")
            return {"reply": reply, "provider": "builtin", "model": "OmniKnowledge-v5"}

    except urllib.error.HTTPError as he:
        return {"reply": f"⚠️ **API Request Error ({he.code})**: Check your API key, endpoint, and try again.\n\n" + get_builtin_knowledge_reply(req.message), "provider": provider, "error": True}
    except Exception as e:
        return {"reply": f"⚠️ **Connection Notice**: Could not reach external provider ({e}). Falling back to OmniKnowledge:\n\n" + get_builtin_knowledge_reply(req.message), "provider": "builtin", "error": True}



if __name__ == "__main__":
    import uvicorn
    import webbrowser

    port = find_available_port(8500)
    url = f"http://localhost:{port}"

    db_init = load_db()
    if db_init.get("watchFolder", {}).get("enabled"):
        daemon.start()

    print("\n=======================================================")
    print(f" OmniConverter PRO 4.2.0 Starting...")
    print(f" URL: {url}")
    print("=======================================================\n")

    threading.Timer(1.2, lambda: webbrowser.open(url)).start()

    uvicorn.run(app, host="127.0.0.1", port=port, limit_max_requests=1000)

