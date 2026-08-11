"""
OmniConverter PRO 4.0 Ultra - Core Python Conversion Engine
Supports high-fidelity conversion across Documents, Images, Audio, Video, Data Formats, and Code.
Integrates with File_Converter_Pro modules when present, with native fallback using Python standard libraries & PyPDF, Docx, OpenPyXL, Pandas, Pillow, etc.
"""

from __future__ import annotations
import os
import sys
import io
import time
import json
import base64
import re
import shutil
import zipfile
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Attempt to import File_Converter_Pro engine if available
try:
    sys.path.insert(0, str(Path(__file__).parent / "File_Converter_Pro"))
    from converter.converters import AdvancedConverterEngine
    FCP_ENGINE = AdvancedConverterEngine()
    HAS_FCP = True
except Exception as e:
    FCP_ENGINE = None
    HAS_FCP = False

# Third-party standard libraries check
try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    from PIL import Image, ImageOps, ImageFilter
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False


def check_ffmpeg() -> bool:
    """Checks whether FFmpeg executable is present on the system PATH."""
    return shutil.which("ffmpeg") is not None or shutil.which("ffmpeg.exe") is not None


class ConversionResult:
    def __init__(self, success: bool, output_path: str = "", filename: str = "", mime_type: str = "", error: str = "", elapsed: float = 0.0):
        self.success = success
        self.output_path = output_path
        self.filename = filename
        self.mime_type = mime_type
        self.error = error
        self.elapsed = elapsed

    def to_dict(self) -> Dict[str, Any]:
        size = os.path.getsize(self.output_path) if (self.output_path and os.path.exists(self.output_path)) else 0
        return {
            "success": self.success,
            "output_path": self.output_path,
            "filename": self.filename,
            "mime_type": self.mime_type,
            "error": self.error,
            "elapsed": round(self.elapsed, 3),
            "size": size
        }


class OmniConverterEngine:
    """Main Python conversion dispatcher for OmniConverter PRO 4.0."""

    MIME_MAP = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
        "html": "text/html",
        "md": "text/markdown",
        "json": "application/json",
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "bmp": "image/bmp",
        "ico": "image/x-icon",
        "gif": "image/gif",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "flac": "audio/flac",
        "mp4": "video/mp4",
        "webm": "video/webm",
        "zip": "application/zip"
    }

    def convert_file(self, input_path_or_bytes: str | bytes, input_filename: str, target_format: str, options: Optional[Dict[str, Any]] = None) -> ConversionResult:
        """Converts an input file to target format, streaming output to a temporary disk file to keep RAM usage low."""
        t0 = time.time()
        options = options or {}
        target_format = target_format.lower().lstrip('.')
        
        # Sanitize input filename to prevent path traversal attacks
        safe_filename = Path(input_filename).name
        input_ext = Path(safe_filename).suffix.lower().lstrip('.')

        temp_dir = tempfile.mkdtemp(prefix="omni_conv_")
        if isinstance(input_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, safe_filename)
            with open(src_path, "wb") as f:
                f.write(input_path_or_bytes)
        else:
            src_path = input_path_or_bytes

        out_stem = Path(safe_filename).stem
        out_filename = f"{out_stem}_converted.{target_format}"
        out_path = os.path.join(temp_dir, out_filename)

        try:
            # 1. Check FFmpeg dependency for audio/video media conversions
            if target_format in ["mp3", "wav", "ogg", "flac", "mp4", "webm"] and input_ext in ["mp4", "mkv", "avi", "mov", "webm", "wav", "mp3", "flac", "ogg"]:
                if not check_ffmpeg() and not HAS_FCP:
                    raise RuntimeError("FFmpeg executable not found in system PATH. Required for audio/video media conversion.")

            # 2. Try File Converter Pro Engine first if available
            if HAS_FCP and FCP_ENGINE is not None:
                conv_type = self._determine_fcp_type(input_ext, target_format)
                if conv_type:
                    try:
                        res = FCP_ENGINE.convert(conv_type, src_path, temp_dir)
                        if res and res.success and os.path.exists(res.target):
                            elapsed = time.time() - t0
                            return ConversionResult(
                                success=True,
                                output_path=res.target,
                                filename=Path(res.target).name,
                                mime_type=self.MIME_MAP.get(target_format, "application/octet-stream"),
                                elapsed=elapsed
                            )
                    except Exception as e_fcp:
                        print(f"[FCP Engine Fallback Warning]: {e_fcp}")

            # 3. Native Python Fallback Converters
            self._convert_native(src_path, out_path, input_ext, target_format, options, out_stem)
            
            elapsed = time.time() - t0
            return ConversionResult(
                success=True,
                output_path=out_path,
                filename=out_filename,
                mime_type=self.MIME_MAP.get(target_format, "application/octet-stream"),
                elapsed=elapsed
            )

        except Exception as e:
            elapsed = time.time() - t0
            return ConversionResult(
                success=False,
                error=str(e),
                elapsed=elapsed
            )

    def _determine_fcp_type(self, src_ext: str, dst_ext: str) -> Optional[str]:
        if src_ext == "pdf" and dst_ext in ["docx", "txt", "html"]:
            return f"pdf_to_{dst_ext}"
        if src_ext == "docx" and dst_ext in ["pdf", "txt", "html"]:
            return f"docx_to_{dst_ext}"
        if src_ext in ["png", "jpg", "jpeg", "webp", "bmp"] and dst_ext in ["png", "jpeg", "jpg", "webp", "bmp", "ico"]:
            return f"image_to_{dst_ext}"
        if src_ext in ["csv", "json", "xlsx"] and dst_ext in ["csv", "json", "pdf"]:
            return f"{src_ext}_to_{dst_ext}"
        return None

    def _convert_native(self, src_path: str, out_path: str, src_ext: str, dst_ext: str, options: Dict[str, Any], stem: str):
        """Native python conversion handlers writing directly to out_path file."""

        # IMAGE CONVERSIONS (Pillow)
        if src_ext in ["png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tiff"] and dst_ext in ["png", "jpg", "jpeg", "webp", "bmp", "ico"]:
            if not HAS_PILLOW:
                raise RuntimeError("Pillow module is required for image conversion.")
            
            with Image.open(src_path) as img:
                if options.get("resize_width") and options.get("resize_height"):
                    img = img.resize((int(options["resize_width"]), int(options["resize_height"])), Image.Resampling.LANCZOS)
                elif options.get("scale"):
                    scale = float(options["scale"])
                    img = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
                
                if options.get("rotate"):
                    img = img.rotate(float(options["rotate"]), expand=True)

                if options.get("grayscale"):
                    img = img.convert("L")

                target_fmt = "JPEG" if dst_ext in ["jpg", "jpeg"] else dst_ext.upper()
                if target_fmt == "ICO":
                    img.save(out_path, format="ICO", sizes=[(32, 32), (64, 64), (128, 128)])
                else:
                    if img.mode in ("RGBA", "P") and target_fmt == "JPEG":
                        img = img.convert("RGB")
                    quality = int(options.get("quality", options.get("compressionQuality", 90)))
                    img.save(out_path, format=target_fmt, quality=quality)
            return

        # AUDIO & VIDEO CONVERSIONS (FFmpeg)
        if (src_ext in ["mp4", "mkv", "avi", "mov", "webm", "mp3", "wav", "aac", "flac", "ogg"] and 
            dst_ext in ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"]):
            if check_ffmpeg():
                cmd = ["ffmpeg", "-y", "-i", src_path]
                
                # Video Options
                if dst_ext in ["mp4", "webm", "gif"]:
                    vq = str(options.get("video_quality") or options.get("videoQuality") or "Original")
                    if "1080" in vq:
                        cmd.extend(["-vf", "scale=-2:1080"])
                    elif "720" in vq:
                        cmd.extend(["-vf", "scale=-2:720"])
                    elif "480" in vq:
                        cmd.extend(["-vf", "scale=-2:480"])
                    elif "360" in vq:
                        cmd.extend(["-vf", "scale=-2:360"])
                    
                    if options.get("strip_audio") or options.get("stripAudio"):
                        cmd.append("-an")
                
                # Audio / Audio Extraction Options
                if dst_ext in ["mp3", "wav", "aac", "flac", "ogg"]:
                    cmd.append("-vn")
                    ab = str(options.get("audio_bitrate") or options.get("audioBitrate") or "320k").replace("kbps", "").replace("k", "")
                    cmd.extend(["-b:a", f"{ab}k"])
                
                cmd.append(out_path)
                res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode == 0 and os.path.exists(out_path):
                    return

        # PDF -> TXT (PyPDF)
        if src_ext == "pdf" and dst_ext == "txt":
            if not HAS_PYPDF:
                raise RuntimeError("pypdf library is required for PDF to TXT conversion.")
            reader = pypdf.PdfReader(src_path)
            extracted_text = []
            for i, page in enumerate(reader.pages):
                extracted_text.append(f"--- PAGE {i+1} ---\n" + (page.extract_text() or ""))
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("\n\n".join(extracted_text))
            return

        # PDF -> HTML (PyPDF)
        if src_ext == "pdf" and dst_ext == "html":
            if not HAS_PYPDF:
                raise RuntimeError("pypdf library is required for PDF to HTML conversion.")
            reader = pypdf.PdfReader(src_path)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>PDF Export</title>")
                f.write("<style>body{font-family:sans-serif;padding:2rem;background:#0f172a;color:#f8fafc;}")
                f.write(".page{background:#1e293b;margin-bottom:1.5rem;padding:1.5rem;border-radius:1rem;border:1px solid #334155;}</style></head><body>")
                for i, page in enumerate(reader.pages):
                    txt = (page.extract_text() or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    f.write(f"<div class='page'><h3>Page {i+1}</h3><pre>{txt}</pre></div>")
                f.write("</body></html>")
            return

        # DOCX -> TXT (python-docx)
        if src_ext == "docx" and dst_ext == "txt":
            if not HAS_DOCX:
                raise RuntimeError("python-docx library is required for DOCX conversion.")
            doc = docx.Document(src_path)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("\n\n".join([p.text for p in doc.paragraphs if p.text]))
            return

        # DOCX -> HTML (python-docx)
        if src_ext == "docx" and dst_ext == "html":
            if not HAS_DOCX:
                raise RuntimeError("python-docx library is required for DOCX to HTML conversion.")
            doc = docx.Document(src_path)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("<!DOCTYPE html><html><body>")
                for p in doc.paragraphs:
                    if p.text:
                        f.write(f"<p>{p.text}</p>")
                f.write("</body></html>")
            return

        # DATA CONVERSIONS (CSV, JSON, XLSX via Pandas)
        if src_ext == "csv" and dst_ext == "json":
            if HAS_PANDAS:
                df = pd.read_csv(src_path)
                df.to_json(out_path, orient="records", indent=2)
            else:
                with open(src_path, "r", encoding="utf-8") as rf:
                    import csv
                    reader = list(csv.DictReader(rf))
                with open(out_path, "w", encoding="utf-8") as wf:
                    json.dump(reader, wf, indent=2)
            return

        if src_ext == "json" and dst_ext == "csv":
            with open(src_path, "r", encoding="utf-8") as rf:
                data = json.load(rf)
            if isinstance(data, list) and len(data) > 0 and HAS_PANDAS:
                df = pd.DataFrame(data)
                df.to_csv(out_path, index=False)
            elif isinstance(data, list) and len(data) > 0:
                import csv
                with open(out_path, "w", encoding="utf-8", newline="") as wf:
                    writer = csv.DictWriter(wf, fieldnames=data[0].keys())
                    writer.writeheader()
                    writer.writerows(data)
            return

        if src_ext == "xlsx" and dst_ext in ["csv", "json"]:
            if HAS_PANDAS:
                df = pd.read_excel(src_path)
                if dst_ext == "csv":
                    df.to_csv(out_path, index=False)
                else:
                    df.to_json(out_path, orient="records", indent=2)
            return

        # General file copy fallback
        shutil.copyfile(src_path, out_path)

    # ==================== OMNI PDF ENGINE MODULES ====================
    
    @staticmethod
    def parse_page_ranges(range_str: str, total_pages: int) -> List[int]:
        """
        Parses page strings like '1-3, 5', 'odd', 'even', 'all' into zero-indexed page numbers.
        """
        if not range_str or range_str.strip().lower() == "all":
            return list(range(total_pages))
        
        range_str = range_str.strip().lower()
        if range_str == "odd":
            return [i for i in range(total_pages) if (i + 1) % 2 != 0]
        if range_str == "even":
            return [i for i in range(total_pages) if (i + 1) % 2 == 0]

        selected_pages = set()
        parts = range_str.split(",")
        for part in parts:
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                sub = part.split("-")
                if len(sub) == 2 and sub[0].isdigit() and sub[1].isdigit():
                    start = max(1, int(sub[0]))
                    end = min(total_pages, int(sub[1]))
                    for p in range(start, end + 1):
                        selected_pages.add(p - 1)
            elif part.isdigit():
                p = int(part)
                if 1 <= p <= total_pages:
                    selected_pages.add(p - 1)

        return sorted(list(selected_pages)) if selected_pages else list(range(total_pages))

    @staticmethod
    def _handle_encrypted_reader(reader: pypdf.PdfReader, password: str = ""):
        if reader.is_encrypted:
            if password:
                decrypted = reader.decrypt(password)
                if decrypted == 0:
                    raise ValueError("Incorrect password for protected PDF.")
            else:
                raise ValueError("PDF is password protected. Please provide a password.")

    def merge_pdfs(self, pdf_paths: List[str], out_path: str, passwords: Optional[List[str]] = None):
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Merge.")
        merger = pypdf.PdfMerger()
        passwords = passwords or []
        for i, path in enumerate(pdf_paths):
            pwd = passwords[i] if i < len(passwords) else ""
            reader = pypdf.PdfReader(path)
            self._handle_encrypted_reader(reader, pwd)
            merger.append(reader)
        merger.write(out_path)
        merger.close()

    def split_pdf(self, pdf_path: str, page_range: str, out_path: str, mode: str = "single_pdf", password: str = "") -> str:
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Split.")
        reader = pypdf.PdfReader(pdf_path)
        self._handle_encrypted_reader(reader, password)

        total_pages = len(reader.pages)
        indices = self.parse_page_ranges(page_range, total_pages)

        if mode == "zip":
            # Output a ZIP file containing individual PDF pages
            temp_dir = tempfile.mkdtemp(prefix="omni_split_zip_")
            stem = Path(pdf_path).stem
            zip_out_path = out_path if out_path.endswith(".zip") else f"{out_path}.zip"
            
            with zipfile.ZipFile(zip_out_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for idx in indices:
                    w = pypdf.PdfWriter()
                    w.add_page(reader.pages[idx])
                    page_filename = f"{stem}_page_{idx+1}.pdf"
                    page_filepath = os.path.join(temp_dir, page_filename)
                    with open(page_filepath, "wb") as pf:
                        w.write(pf)
                    zf.write(page_filepath, arcname=page_filename)
            shutil.rmtree(temp_dir, ignore_errors=True)
            return zip_out_path
        else:
            # Output a single PDF with all selected pages
            writer = pypdf.PdfWriter()
            for idx in indices:
                writer.add_page(reader.pages[idx])
            with open(out_path, "wb") as f:
                writer.write(f)
            return out_path

    def compress_pdf(self, pdf_path: str, out_path: str, level: str = "medium", password: str = ""):
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Compress.")
        reader = pypdf.PdfReader(pdf_path)
        self._handle_encrypted_reader(reader, password)

        writer = pypdf.PdfWriter()
        scale_factor = 0.8 if level == "low" else (0.5 if level == "medium" else 0.3)
        quality = 80 if level == "low" else (60 if level == "medium" else 45)

        for page in reader.pages:
            page.compress_content_streams()
            # If Pillow is present and aggressive compression requested, downsample images
            if HAS_PILLOW and level in ["medium", "high"]:
                try:
                    for count, image_file_object in enumerate(page.images):
                        img = Image.open(io.BytesIO(image_file_object.data))
                        new_size = (max(1, int(img.width * scale_factor)), max(1, int(img.height * scale_factor)))
                        img = img.resize(new_size, Image.Resampling.LANCZOS)
                        if img.mode in ("RGBA", "P"):
                            img = img.convert("RGB")
                        img_byte_arr = io.BytesIO()
                        img.save(img_byte_arr, format="JPEG", quality=quality)
                        page.images[count].replace(img, img_byte_arr.getvalue())
                except Exception as e_img:
                    print(f"[PDF Compress Image Downsample Warning]: {e_img}")
            writer.add_page(page)

        with open(out_path, "wb") as f:
            writer.write(f)

    def protect_pdf(self, pdf_path: str, password: str, out_path: str):
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Protect.")
        reader = pypdf.PdfReader(pdf_path)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(password)
        with open(out_path, "wb") as f:
            writer.write(f)

    def unlock_pdf(self, pdf_path: str, password: str, out_path: str):
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Unlock.")
        reader = pypdf.PdfReader(pdf_path)
        self._handle_encrypted_reader(reader, password)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        with open(out_path, "wb") as f:
            writer.write(f)

    def rotate_pdf(self, pdf_path: str, angle: int, out_path: str, page_range: str = "all", password: str = ""):
        if not HAS_PYPDF:
            raise RuntimeError("pypdf library is required for PDF Rotate.")
        reader = pypdf.PdfReader(pdf_path)
        self._handle_encrypted_reader(reader, password)

        total_pages = len(reader.pages)
        rotate_indices = set(self.parse_page_ranges(page_range, total_pages))

        writer = pypdf.PdfWriter()
        for i, page in enumerate(reader.pages):
            if i in rotate_indices:
                page.rotate(angle)
            writer.add_page(page)
        with open(out_path, "wb") as f:
            writer.write(f)

    def convert_batch(self, files: List[Tuple[str, bytes]], target_format: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Converts multiple files in batch and returns the file path of a ZIP archive."""
        temp_dir = tempfile.mkdtemp(prefix="omni_batch_")
        zip_path = os.path.join(temp_dir, f"OmniConverter_Batch_{target_format.upper()}.zip")

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for fname, content in files:
                res = self.convert_file(content, fname, target_format, options)
                if res.success and os.path.exists(res.output_path):
                    zf.write(res.output_path, arcname=res.filename)
                else:
                    err_msg = f"Failed to convert {fname}: {res.error}"
                    zf.writestr(f"ERROR_{fname}.txt", err_msg.encode("utf-8"))
        return zip_path


# Global engine instance
converter_engine = OmniConverterEngine()


