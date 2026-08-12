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
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from converter_engine import converter_engine, check_ffmpeg
from watch_daemon import WatchFolderDaemon

app = FastAPI(
    title="OmniConverter PRO 4.0 Ultra Server",
    description="Python-powered backend conversion engine & automation daemon",
    version="4.0.0"
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

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Instantiate Watch Folder Daemon
daemon = WatchFolderDaemon(DATA_FILE)

def find_available_port(start_port: int = 8500) -> int:
    """Finds an available free port starting from start_port to avoid port conflicts."""
    for p in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return start_port

def load_db() -> Dict[str, Any]:
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
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[DB Save Error]: {e}")

def cleanup_temp_file(file_path: str):
    """Background task to remove temp conversion directory after file streaming."""
    try:
        parent_dir = Path(file_path).parent
        if parent_dir.exists() and ("omni_conv_" in parent_dir.name or "omni_batch_" in parent_dir.name):
            shutil.rmtree(parent_dir, ignore_errors=True)
    except Exception as e:
        print(f"[Cleanup Warning]: {e}")

# Serve main application HTML page
@app.get("/")
async def get_index():
    index_path = TEMPLATES_DIR / "index.html"
    template_path = TEMPLATES_DIR / "omni.html"
    root_path = BASE_DIR / "omni.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")
    elif template_path.exists():
        return FileResponse(template_path, media_type="text/html")
    elif root_path.exists():
        return FileResponse(root_path, media_type="text/html")
    return {"message": "OmniConverter Server running."}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silences browser favicon 404 console warnings."""
    return Response(status_code=204)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "version": "4.0.0",
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

