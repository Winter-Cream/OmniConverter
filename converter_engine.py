"""
OmniConverter 5 Pro Max - Core Python Conversion Engine
Supports high-fidelity conversion across Documents, Images, Audio, Video, Data Formats, and Code.
Integrates with File_Converter_Pro modules when present, with native fallback using Python standard libraries & PyPDF, Docx, Pandas, Pillow, etc.
"""

from __future__ import annotations
import os
import sys
import io
import time
import json
import base64
import re
import html
import uuid
import shutil
import zipfile
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from conversion_architecture import (
    ConverterRegistry, NativeConverterPlugin, detect_file_format, find_conversion_path,
)

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
    from pptx import Presentation
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

try:
    from pdf2docx import Converter as PDF2DocxConverter
    HAS_PDF2DOCX = True
except ImportError:
    HAS_PDF2DOCX = False

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

try:
    import win32com.client
    import pythoncom
    HAS_WIN32COM = True
except ImportError:
    HAS_WIN32COM = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    from PIL import Image, ImageOps, ImageFilter, ExifTags
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    try:
        import fitz as pymupdf
        HAS_PYMUPDF = True
    except ImportError:
        pymupdf = None
        HAS_PYMUPDF = False

try:
    from rapidocr_onnxruntime import RapidOCR
    RAPID_OCR_INSTANCE = RapidOCR()
    HAS_RAPIDOCR = True
except Exception:
    RAPID_OCR_INSTANCE = None
    HAS_RAPIDOCR = False

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


def convert_office_document_with_com(app_name: str, src_path: str, out_path: str) -> bool:
    """Convert Word (.docx, .doc) or PowerPoint (.pptx, .ppt) to PDF via Office COM on Windows."""
    if not HAS_WIN32COM:
        return False
    try:
        pythoncom.CoInitialize()
        src_abs = os.path.abspath(src_path)
        out_abs = os.path.abspath(out_path)

        if app_name.lower() == "powerpoint":
            ppt = win32com.client.Dispatch("PowerPoint.Application")
            try:
                deck = ppt.Presentations.Open(src_abs, WithWindow=False)
                deck.SaveAs(out_abs, 32)  # 32 = ppSaveAsPDF
                deck.Close()
            finally:
                ppt.Quit()
            return os.path.exists(out_abs) and os.path.getsize(out_abs) > 0

        elif app_name.lower() == "word":
            word = win32com.client.Dispatch("Word.Application")
            word.Visible = False
            try:
                doc = word.Documents.Open(src_abs)
                doc.SaveAs2(out_abs, FileFormat=17)  # 17 = wdFormatPDF
                doc.Close(False)
            finally:
                word.Quit()
            return os.path.exists(out_abs) and os.path.getsize(out_abs) > 0

    except Exception as e:
        print(f"[Office COM Warning ({app_name})]: {e}")
        return False
    finally:
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass
    return False


def _pptx_to_pdf_native(src_path: str, out_path: str):
    """
    Pure Python PPTX to PDF converter using python-pptx and PyMuPDF.
    Extracts slides, shapes, text, bullets, tables, and images.
    """
    if not HAS_PPTX:
        raise RuntimeError("python-pptx library is required for PPTX conversion.")
    if not HAS_PYMUPDF:
        raise RuntimeError("PyMuPDF library is required for rendering PPTX to PDF.")

    prs = Presentation(src_path)
    sw = (prs.slide_width / 12700) if prs.slide_width else 960
    sh = (prs.slide_height / 12700) if prs.slide_height else 540

    pdf_doc = pymupdf.open()
    margin_x = 50
    content_w = sw - (2 * margin_x)

    for slide_idx, slide in enumerate(prs.slides):
        page = pdf_doc.new_page(width=sw, height=sh)
        page.draw_rect(pymupdf.Rect(0, 0, sw, sh), color=None, fill=(0.98, 0.98, 0.99))
        page.insert_text((sw - 80, 25), f"Slide {slide_idx + 1}", fontsize=8, color=(0.5, 0.5, 0.5))

        curr_y = 50
        title_txt = ""
        try:
            if slide.shapes.title and slide.shapes.title.text.strip():
                title_txt = slide.shapes.title.text.strip()
                rect = pymupdf.Rect(margin_x, curr_y, margin_x + content_w, curr_y + 45)
                page.insert_textbox(rect, title_txt, fontsize=18, fontname="helv", color=(0.08, 0.15, 0.35))
                curr_y += 48
        except Exception:
            pass

        for shape in slide.shapes:
            if shape == slide.shapes.title:
                continue

            # Images
            try:
                if hasattr(shape, "image") and shape.image:
                    img_bytes = shape.image.blob
                    left = (shape.left / 12700) if shape.left else margin_x
                    top = (shape.top / 12700) if shape.top else curr_y
                    w = (shape.width / 12700) if shape.width else 200
                    h = (shape.height / 12700) if shape.height else 150
                    rect = pymupdf.Rect(max(10, left), max(10, top), min(sw - 10, left + w), min(sh - 10, top + h))
                    if rect.width > 20 and rect.height > 20:
                        page.insert_image(rect, stream=img_bytes)
            except Exception:
                pass

            # Tables
            try:
                if shape.has_table:
                    tbl = shape.table
                    cell_text_rows = []
                    for row in tbl.rows:
                        row_cells = [c.text.strip().replace("\n", " ") for c in row.cells]
                        cell_text_rows.append(" | ".join(row_cells))
                    tbl_str = "\n".join(cell_text_rows)
                    if tbl_str:
                        rect = pymupdf.Rect(margin_x, curr_y, margin_x + content_w, min(sh - 30, curr_y + 100))
                        page.insert_textbox(rect, tbl_str, fontsize=10, color=(0.1, 0.1, 0.2))
                        curr_y += 105
            except Exception:
                pass

            # Text frames
            try:
                if shape.has_text_frame:
                    paragraphs = shape.text_frame.paragraphs
                    for p in paragraphs:
                        txt = p.text.strip()
                        if not txt or txt == title_txt:
                            continue
                        bullet_prefix = "• " if (p.level and p.level > 0) else ""
                        line_txt = f"{bullet_prefix}{txt}"
                        font_sz = max(9, 12 - (p.level or 0))
                        indent = 15 * (p.level or 0)
                        rect = pymupdf.Rect(margin_x + indent, curr_y, margin_x + content_w, curr_y + 24)
                        page.insert_textbox(rect, line_txt, fontsize=font_sz, fontname="helv", color=(0.15, 0.18, 0.22))
                        curr_y += 24
                        if curr_y > sh - 40:
                            break
            except Exception:
                pass

    if len(pdf_doc) == 0:
        page = pdf_doc.new_page(width=sw, height=sh)
        page.insert_text((margin_x, sh / 2), "Empty Presentation", fontsize=14)

    pdf_doc.save(out_path)
    pdf_doc.close()


def _docx_to_pdf_native(src_path: str, out_path: str):
    """
    Pure Python DOCX to PDF converter using python-docx and PyMuPDF.
    """
    if not HAS_DOCX:
        raise RuntimeError("python-docx library is required for DOCX conversion.")
    if not HAS_PYMUPDF:
        raise RuntimeError("PyMuPDF library is required for rendering DOCX to PDF.")

    doc_in = docx.Document(src_path)
    pdf_doc = pymupdf.open()
    page_w, page_h = 595, 842  # A4
    curr_page = pdf_doc.new_page(width=page_w, height=page_h)
    margin = 54
    curr_y = margin
    max_w = page_w - (2 * margin)

    for p in doc_in.paragraphs:
        txt = p.text.strip()
        if not txt:
            curr_y += 10
            continue

        is_heading = p.style and "Heading" in p.style.name
        font_sz = 15 if is_heading else 10
        font_name = "helv-bold" if is_heading else "helv"
        color = (0.08, 0.15, 0.35) if is_heading else (0.15, 0.15, 0.15)
        line_height = 22 if is_heading else 14

        if curr_y + line_height > page_h - margin:
            curr_page = pdf_doc.new_page(width=page_w, height=page_h)
            curr_y = margin

        curr_page.insert_textbox(
            pymupdf.Rect(margin, curr_y, margin + max_w, curr_y + (line_height * 4)),
            txt,
            fontsize=font_sz,
            fontname=font_name,
            color=color
        )
        curr_y += line_height + 4

    for tbl in doc_in.tables:
        for row in tbl.rows:
            row_txt = "  |  ".join(c.text.strip().replace("\n", " ") for c in row.cells)
            if curr_y + 18 > page_h - margin:
                curr_page = pdf_doc.new_page(width=page_w, height=page_h)
                curr_y = margin
            curr_page.insert_textbox(
                pymupdf.Rect(margin, curr_y, margin + max_w, curr_y + 18),
                row_txt,
                fontsize=9,
                fontname="helv",
                color=(0.2, 0.2, 0.3)
            )
            curr_y += 18

    if len(pdf_doc) == 0:
        pdf_doc.new_page(width=page_w, height=page_h)

    pdf_doc.save(out_path)
    pdf_doc.close()



def get_ffmpeg_executable() -> Optional[str]:
    """Find system FFmpeg or the portable binary bundled by imageio-ffmpeg."""
    executable = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    if executable:
        return executable
    try:
        import imageio_ffmpeg
        bundled = imageio_ffmpeg.get_ffmpeg_exe()
        return bundled if os.path.isfile(bundled) else None
    except (ImportError, RuntimeError, OSError):
        return None


def check_ffmpeg() -> bool:
    """Return whether a system or bundled FFmpeg executable is available."""
    return get_ffmpeg_executable() is not None


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
    """Main Python conversion dispatcher for OmniConverter 5 Pro Max."""

    MIME_MAP = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "ppt": "application/vnd.ms-powerpoint",
        "txt": "text/plain",
        "html": "text/html",
        "htm": "text/html",
        "md": "text/markdown",
        "json": "application/json",
        "csv": "text/csv",
        "tsv": "text/tab-separated-values",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xml": "application/xml",
        "yaml": "application/x-yaml",
        "yml": "application/x-yaml",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "bmp": "image/bmp",
        "ico": "image/x-icon",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "tiff": "image/tiff",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "flac": "audio/flac",
        "aac": "audio/aac",
        "m4a": "audio/mp4",
        "opus": "audio/opus",
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mkv": "video/x-matroska",
        "avi": "video/x-msvideo",
        "mov": "video/quicktime",
        "zip": "application/zip"
    }

    FORMAT_CATEGORIES = {
        "presentation": {
            "name": "Presentations (PPTX)",
        "extensions": ["pptx"],
            "targets": ["pdf", "docx", "txt", "html", "png", "jpg"]
        },
        "document": {
            "name": "Documents & Text",
            "extensions": ["pdf", "docx", "txt", "html", "htm", "md"],
            "targets": ["pdf", "docx", "txt", "html", "md", "png", "jpg"]
        },
        "image": {
            "name": "Image Formats",
            "extensions": ["png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tiff", "svg"],
            "targets": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"]
        },
        "audio": {
            "name": "Audio",
            "extensions": ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"],
            "targets": ["mp3", "wav", "ogg", "flac", "aac"]
        },
        "video": {
            "name": "Video",
            "extensions": ["mp4", "webm", "mkv", "avi", "mov", "flv", "wmv", "m4v"],
            "targets": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"]
        },
        "data": {
            "name": "Data & Code",
            "extensions": ["csv", "tsv", "xlsx", "json", "xml", "yaml", "yml", "py", "js", "ts", "sql", "java", "c", "cpp", "rs", "go"],
            "targets": ["csv", "tsv", "xlsx", "json", "yaml", "txt", "html", "pdf"]
        }
    }

    FORMAT_TARGETS = {
        "pptx": ["pdf", "docx", "txt", "html", "png", "jpg"],
        "pdf": ["pdf", "docx", "txt", "html", "png", "jpg"],
        "docx": ["docx", "pdf", "txt", "html", "png", "jpg"],
        "txt": ["txt", "pdf", "docx", "json"], "md": ["md", "pdf", "html", "docx"],
        "html": ["html", "pdf", "txt", "docx"], "htm": ["html", "pdf", "txt", "docx"],
        "png": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "jpg": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "jpeg": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "webp": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "bmp": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "gif": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "ico": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "tiff": ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"], "svg": ["pdf", "png", "jpg", "jpeg", "webp"],
        "csv": ["csv", "tsv", "xlsx", "json", "txt", "pdf"], "tsv": ["csv", "tsv", "xlsx", "json", "txt", "pdf"], "xlsx": ["csv", "tsv", "xlsx", "json", "txt", "pdf"],
        "json": ["json", "yaml", "yml", "csv", "tsv", "xlsx", "txt"], "yaml": ["yaml", "json"], "yml": ["yml", "json"], "xml": ["xml", "json"],
        "py": ["py", "txt", "html", "pdf"], "js": ["js", "txt", "html", "pdf"], "ts": ["ts", "txt", "html", "pdf"], "java": ["java", "txt", "html", "pdf"], "c": ["c", "txt", "html", "pdf"], "cpp": ["cpp", "txt", "html", "pdf"], "rs": ["rs", "txt", "html", "pdf"], "go": ["go", "txt", "html", "pdf"], "sql": ["sql", "txt", "html", "pdf"],
        "mp3": ["mp3", "wav", "ogg", "flac", "aac"], "wav": ["mp3", "wav", "ogg", "flac", "aac"], "ogg": ["mp3", "wav", "ogg", "flac", "aac"], "flac": ["mp3", "wav", "ogg", "flac", "aac"], "aac": ["mp3", "wav", "ogg", "flac", "aac"], "m4a": ["mp3", "wav", "ogg", "flac", "aac"], "opus": ["mp3", "wav", "ogg", "flac", "aac"],
        "mp4": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "webm": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "mkv": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "avi": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "mov": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "flv": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "wmv": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"], "m4v": ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"]
    }

    def __init__(self):
        self.registry = ConverterRegistry()
        category_groups = {
            "documents": {"pdf", "docx", "pptx", "txt", "html", "htm", "md"},
            "images": {"png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tiff", "svg"},
            "media": {"mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "mp4", "webm", "mkv", "avi", "mov", "flv", "wmv", "m4v"},
            "data": {"csv", "tsv", "xlsx", "json", "xml", "yaml", "yml", "py", "js", "ts", "sql", "java", "c", "cpp", "rs", "go"},
        }
        for name, formats in category_groups.items():
            self.registry.register(NativeConverterPlugin(
                name=name, formats=frozenset(formats), targets=self.FORMAT_TARGETS,
                handler=self._convert_native,
            ))

    def detect_format(self, data: bytes, filename: str) -> str | None:
        """Return a recognized content format, correcting a misleading filename suffix."""
        return detect_file_format(data, filename, set(self.FORMAT_TARGETS))

    def inspect_metadata(self, data: bytes, filename: str) -> Dict[str, Any]:
        """Return a small, safe-to-display summary of common PDF and image metadata."""
        actual = self.detect_format(data, filename)
        fields: Dict[str, str] = {}
        if actual == "pdf" and HAS_PYMUPDF:
            document = pymupdf.open(stream=data, filetype="pdf")
            try:
                metadata = document.metadata or {}
                for key, label in (("title", "Title"), ("author", "Author"), ("subject", "Subject"),
                                   ("creator", "Creator"), ("producer", "Producer"),
                                   ("creationDate", "Created"), ("modDate", "Modified")):
                    value = metadata.get(key)
                    if value and str(value).strip():
                        fields[label] = str(value).strip()[:300]
            finally:
                document.close()
        elif actual in {"jpg", "jpeg", "tiff", "webp", "png", "bmp", "gif", "ico"} and HAS_PILLOW:
            with Image.open(io.BytesIO(data)) as image:
                exif = image.getexif()
                tag_names = {tag_id: name for tag_id, name in ExifTags.TAGS.items()}
                for tag_id, label in ((271, "Camera make"), (272, "Camera model"), (305, "Software"),
                                      (306, "Date taken"), (315, "Author"), (33432, "Copyright")):
                    value = exif.get(tag_id)
                    if value:
                        fields[label] = str(value).strip()[:300]
                gps_pointer = exif.get(34853)
                if gps_pointer:
                    try:
                        gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
                        gps_names = {tag_id: name for tag_id, name in ExifTags.GPSTAGS.items()}
                        gps = {gps_names.get(key, str(key)): value for key, value in gps_ifd.items()}
                        def decimal_degrees(value: Any) -> float:
                            return float(value[0]) + float(value[1]) / 60 + float(value[2]) / 3600
                        lat, lon = gps.get("GPSLatitude"), gps.get("GPSLongitude")
                        if lat and lon:
                            latitude, longitude = decimal_degrees(lat), decimal_degrees(lon)
                            if gps.get("GPSLatitudeRef") == "S": latitude *= -1
                            if gps.get("GPSLongitudeRef") == "W": longitude *= -1
                            fields["GPS coordinates"] = f"{latitude:.6f}, {longitude:.6f}"
                    except (KeyError, TypeError, ValueError, ZeroDivisionError):
                        fields["GPS location"] = "GPS data present"
                # Some formats expose useful non-camera tags through the standard EXIF map.
                for tag_id, value in exif.items():
                    label = tag_names.get(tag_id)
                    if label and label not in fields and isinstance(value, (str, int, float)) and str(value).strip():
                        fields[label.replace("_", " ").title()] = str(value).strip()[:200]
        return {"format": actual, "has_metadata": bool(fields), "fields": fields}

    def get_supported_formats(self) -> Dict[str, Any]:
        """Returns categories, supported extensions and target maps."""
        all_exts = {}
        for cat_id, cat_data in self.FORMAT_CATEGORIES.items():
            for ext in cat_data["extensions"]:
                all_exts[ext] = {
                    "category": cat_id,
                    "category_name": cat_data["name"],
                    "targets": self.FORMAT_TARGETS.get(ext, cat_data["targets"])
                }
        return {
            "categories": self.FORMAT_CATEGORIES,
            "extensions": all_exts
        }

    def convert_file(self, input_path_or_bytes: str | bytes, input_filename: str, target_format: str, options: Optional[Dict[str, Any]] = None) -> ConversionResult:
        """Detect the input, find a shortest supported route, and execute each conversion step."""
        options = options or {}
        target = target_format.lower().lstrip(".")
        try:
            content = input_path_or_bytes if isinstance(input_path_or_bytes, bytes) else Path(input_path_or_bytes).read_bytes()
            actual = self.detect_format(content, input_filename)
            if actual is None:
                return ConversionResult(False, error="Could not identify this file as a supported format.")
            source = Path(input_filename).suffix.lower().lstrip(".")
            source = actual
            path = find_conversion_path(source, target, self.FORMAT_TARGETS)
            if path is None:
                return ConversionResult(False, error=f"No conversion route is available from {source.upper()} to {target.upper()}.")
            if len(path) == 1:
                return self._convert_single_step(input_path_or_bytes, f"{Path(input_filename).stem}.{source}", target, options)

            current_data = content
            result = None
            current_name = f"{Path(input_filename).stem}.{source}"
            for next_format in path[1:]:
                result = self._convert_single_step(current_data, current_name, next_format, options)
                if not result.success:
                    return result
                if next_format != target:
                    current_data = Path(result.output_path).read_bytes()
                    current_name = f"{Path(current_name).stem}.{next_format}"
                    shutil.rmtree(Path(result.output_path).parent, ignore_errors=True)
            return result
        except (OSError, ValueError) as exc:
            return ConversionResult(False, error=f"Unable to read or route this file: {exc}")

    def _convert_single_step(self, input_path_or_bytes: str | bytes, input_filename: str, target_format: str, options: Optional[Dict[str, Any]] = None) -> ConversionResult:
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
            if target_format in ["mp3", "wav", "ogg", "flac", "aac", "mp4", "webm", "gif"] and input_ext in ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "wav", "mp3", "aac", "m4a", "opus", "flac", "ogg"]:
                if not check_ffmpeg() and not HAS_FCP:
                    raise RuntimeError("FFmpeg executable not found. Install FFmpeg or reinstall OmniConverter's Python dependencies, then restart.")

            # 2. Try File Converter Pro Engine first if available
            if HAS_FCP and FCP_ENGINE is not None and not options.get("strip_metadata") and not options.get("target_size_preset"):
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
            plugin = self.registry.resolve(input_ext, target_format)
            if plugin is None:
                raise RuntimeError(f"No {input_ext.upper()} to {target_format.upper()} converter is registered.")
            plugin.convert(src_path, out_path, input_ext, target_format, options, out_stem)
            if not os.path.isfile(out_path) or os.path.getsize(out_path) == 0:
                raise RuntimeError("The converter did not produce a valid output file.")
            if target_format == "pdf" and self._target_size_bytes(options) and input_ext != "pdf":
                self._optimize_pdf_to_size(out_path, self._target_size_bytes(options), bool(options.get("strip_metadata")))
            # Multi-page PDF-to-image conversion is returned as a ZIP of page images.
            if input_ext == "pdf" and target_format in ["png", "jpg", "jpeg", "webp"] and zipfile.is_zipfile(out_path):
                out_filename = f"{out_stem}_converted.zip"

            elapsed = time.time() - t0
            return ConversionResult(
                success=True,
                output_path=out_path,
                filename=out_filename,
                mime_type="application/zip" if out_filename.endswith(".zip") else self.MIME_MAP.get(target_format, "application/octet-stream"),
                elapsed=elapsed
            )

        except Exception as e:
            elapsed = time.time() - t0
            shutil.rmtree(temp_dir, ignore_errors=True)
            return ConversionResult(
                success=False,
                error=str(e),
                elapsed=elapsed
            )

    def _determine_fcp_type(self, src_ext: str, dst_ext: str) -> Optional[str]:
        if src_ext in ["pptx", "ppt"] and dst_ext in ["pdf", "docx", "txt"]:
            return f"{src_ext}_to_{dst_ext}"
        if src_ext == "pdf" and dst_ext in ["docx", "txt", "html"]:
            return f"pdf_to_{dst_ext}"
        if src_ext in ["docx", "doc"] and dst_ext in ["pdf", "txt", "html"]:
            return f"docx_to_{dst_ext}"
        if src_ext in ["png", "jpg", "jpeg", "webp", "bmp"] and dst_ext in ["png", "jpeg", "jpg", "webp", "bmp", "ico", "pdf"]:
            return f"image_to_{dst_ext}"
        if src_ext in ["json"] and dst_ext in ["json", "pdf", "yaml", "txt"]:
            return f"{src_ext}_to_{dst_ext}"
        return None

    @staticmethod
    def _target_size_bytes(options: Dict[str, Any]) -> int | None:
        """Resolve the UI's size preset to an approximate output byte budget."""
        presets = {"email_2mb": 2 * 1024 * 1024, "under_10mb": 10 * 1024 * 1024}
        return presets.get(str(options.get("target_size_preset", "")))

    @staticmethod
    def _probe_duration(path: str) -> float | None:
        """Read media duration through ffprobe when installed; return None when unavailable."""
        executable = shutil.which("ffprobe") or shutil.which("ffprobe.exe")
        if not executable:
            return None
        try:
            result = subprocess.run(
                [executable, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
                capture_output=True, text=True, timeout=10, check=False,
            )
            duration = float(result.stdout.strip())
            return duration if result.returncode == 0 and duration > 0 else None
        except (OSError, ValueError, subprocess.TimeoutExpired):
            return None

    @staticmethod
    def _optimize_pdf_to_size(pdf_path: str, target_bytes: int, strip_metadata: bool = False) -> None:
        """Re-encode PDF images at progressively smaller settings toward a byte budget."""
        if not HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF is required for PDF target-size compression.")
        trial_path = f"{pdf_path}.optimized"
        for dpi, quality in ((200, 80), (160, 65), (120, 50), (96, 35), (72, 25)):
            document = pymupdf.open(pdf_path)
            try:
                if strip_metadata:
                    document.set_metadata({})
                    document.set_xml_metadata("")
                document.rewrite_images(dpi_target=dpi, quality=quality)
                document.save(trial_path, garbage=4, deflate=True, deflate_images=True,
                              deflate_fonts=True, use_objstms=1)
            finally:
                document.close()
            if os.path.getsize(trial_path) <= target_bytes:
                os.replace(trial_path, pdf_path)
                return
        os.replace(trial_path, pdf_path)

    def _convert_native(self, src_path: str, out_path: str, src_ext: str, dst_ext: str, options: Dict[str, Any], stem: str):
        """Native python conversion handlers writing directly to out_path file."""

        # Same-format privacy scrubbing must re-save rather than copy the source bytes.
        if src_ext == dst_ext:
            if options.get("strip_metadata") and src_ext == "pdf" and not self._target_size_bytes(options):
                if HAS_PYMUPDF:
                    document = pymupdf.open(src_path)
                    try:
                        document.set_metadata({})
                        document.set_xml_metadata("")
                        document.save(out_path, garbage=4, deflate=True)
                    finally:
                        document.close()
                    return
                if HAS_PYPDF:
                    reader = pypdf.PdfReader(src_path)
                    writer = pypdf.PdfWriter()
                    for page in reader.pages:
                        writer.add_page(page)
                    writer.add_metadata({})
                    with open(out_path, "wb") as output:
                        writer.write(output)
                    return
                raise RuntimeError("PyMuPDF or pypdf is required to scrub PDF metadata.")
            if src_ext == "pdf" and self._target_size_bytes(options):
                self._optimize_pdf_to_size(src_path, self._target_size_bytes(options), bool(options.get("strip_metadata")))
                shutil.copyfile(src_path, out_path)
                return
            media_formats = {"mp3", "wav", "aac", "flac", "ogg", "m4a", "opus", "mp4", "webm", "mkv", "avi", "mov", "flv", "wmv", "m4v"}
            media_reencode = src_ext in media_formats and (
                bool(self._target_size_bytes(options))
                or bool(options.get("audio_bitrate") or options.get("audioBitrate"))
                or bool(options.get("video_quality") and options.get("video_quality") != "Original")
                or bool(options.get("strip_audio") or options.get("stripAudio"))
            )
            if not media_reencode and not (options.get("strip_metadata") and src_ext in {"png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tiff"}):
                shutil.copyfile(src_path, out_path)
                return

        # 1. IMAGE -> IMAGE & IMAGE -> PDF (Pillow)
        if src_ext in ["png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tiff"]:
            if dst_ext == "pdf":
                if not HAS_PILLOW:
                    raise RuntimeError("Pillow module is required for image to PDF conversion.")
                with Image.open(src_path) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(out_path, format="PDF")
                return

            if dst_ext in ["png", "jpg", "jpeg", "webp", "bmp", "ico"]:
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
                    save_metadata = {}
                    if not options.get("strip_metadata") and target_fmt in {"JPEG", "WEBP", "PNG", "TIFF"}:
                        try:
                            exif_bytes = img.getexif().tobytes()
                            if exif_bytes:
                                save_metadata["exif"] = exif_bytes
                        except (AttributeError, OSError, ValueError):
                            pass
                    if target_fmt == "ICO":
                        img.save(out_path, format="ICO", sizes=[(32, 32), (64, 64), (128, 128)])
                    elif target_fmt == "PNG":
                        img.save(out_path, format="PNG", optimize=True, **save_metadata)
                    else:
                        if img.mode in ("RGBA", "P") and target_fmt == "JPEG":
                            img = img.convert("RGB")
                        quality = int(options.get("quality", options.get("compressionQuality", 90)))
                        target_bytes = self._target_size_bytes(options)
                        if target_bytes and target_fmt in {"JPEG", "WEBP"}:
                            # Try progressively lower quality, then reduce dimensions if needed.
                            candidate = img.copy()
                            while True:
                                for candidate_quality in range(min(quality, 95), 19, -10):
                                    candidate.save(out_path, format=target_fmt, quality=candidate_quality, optimize=True, **save_metadata)
                                    if os.path.getsize(out_path) <= target_bytes:
                                        return
                                if candidate.width <= 160 or candidate.height <= 160:
                                    break
                                candidate = candidate.resize((max(1, int(candidate.width * 0.85)), max(1, int(candidate.height * 0.85))), Image.Resampling.LANCZOS)
                            return
                        img.save(out_path, format=target_fmt, quality=quality, **save_metadata)
                return

        # 2. PDF -> IMAGES (PyMuPDF)
        if src_ext == "pdf" and dst_ext in ["png", "jpg", "jpeg", "webp"]:
            if not HAS_PYMUPDF:
                raise RuntimeError("PyMuPDF is required for PDF to image conversion.")
            doc = pymupdf.open(src_path)
            dpi = int(options.get("dpi", 150))
            if len(doc) == 0:
                doc.close()
                raise ValueError("PDF document has no pages.")
            elif len(doc) == 1:
                pix = doc[0].get_pixmap(dpi=dpi)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                fmt = "JPEG" if dst_ext in ["jpg", "jpeg"] else dst_ext.upper()
                img.save(out_path, format=fmt)
            else:
                zip_temp = f"{out_path}.zip"
                with zipfile.ZipFile(zip_temp, "w", zipfile.ZIP_DEFLATED) as zf:
                    for i, page in enumerate(doc):
                        pix = page.get_pixmap(dpi=dpi)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        img_buf = io.BytesIO()
                        fmt = "JPEG" if dst_ext in ["jpg", "jpeg"] else dst_ext.upper()
                        img.save(img_buf, format=fmt)
                        zf.writestr(f"{stem}_page_{i+1}.{dst_ext}", img_buf.getvalue())
                shutil.move(zip_temp, out_path)
            doc.close()
            return

        # 3. TEXT & MARKDOWN -> PDF (PyMuPDF)
        if src_ext in ["txt", "md"] and dst_ext == "pdf":
            if HAS_PYMUPDF:
                with open(src_path, "r", encoding="utf-8", errors="ignore") as tf:
                    content = tf.read()
                doc = pymupdf.open()
                lines = content.splitlines() or [""]
                lines_per_page = 42
                for p_start in range(0, max(1, len(lines)), lines_per_page):
                    page = doc.new_page(width=595, height=842)
                    page_text = "\n".join(lines[p_start:p_start + lines_per_page])
                    page.insert_text((50, 72), page_text, fontsize=10)
                doc.save(out_path)
                doc.close()
                return

        # 4. MARKDOWN -> HTML
        if src_ext == "md" and dst_ext == "html":
            with open(src_path, "r", encoding="utf-8", errors="ignore") as rf:
                md_lines = rf.read().splitlines()
            html_lines = [
                f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>{stem}</title>",
                "<style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:2rem;max-width:800px;margin:auto;color:#1e293b;}</style></head><body>"
            ]
            for l in md_lines:
                if l.startswith("# "):
                    html_lines.append(f"<h1>{l[2:]}</h1>")
                elif l.startswith("## "):
                    html_lines.append(f"<h2>{l[3:]}</h2>")
                elif l.startswith("### "):
                    html_lines.append(f"<h3>{l[4:]}</h3>")
                elif l.strip():
                    html_lines.append(f"<p>{l}</p>")
            html_lines.append("</body></html>")
            with open(out_path, "w", encoding="utf-8") as wf:
                wf.write("\n".join(html_lines))
            return

        # HTML and HTM use the same markup; normalize the output extension.
        if src_ext in ["html", "htm"] and dst_ext in ["html", "htm"]:
            shutil.copyfile(src_path, out_path)
            return

        # 5. AUDIO & VIDEO CONVERSIONS (FFmpeg)
        if (src_ext in ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "mp3", "wav", "aac", "flac", "ogg", "m4a", "opus"] and
            dst_ext in ["mp4", "webm", "gif", "mp3", "wav", "aac", "flac", "ogg"]):
            ffmpeg_executable = get_ffmpeg_executable()
            if ffmpeg_executable:
                cmd = [ffmpeg_executable, "-y", "-i", src_path]
                target_bytes = self._target_size_bytes(options)
                target_bitrate_set = False
                if target_bytes:
                    duration = self._probe_duration(src_path)
                    if duration:
                        total_kbps = max(32, int(target_bytes * 8 * 0.88 / duration / 1000))
                        if dst_ext in ["mp4", "webm"]:
                            audio_kbps = min(128, max(32, total_kbps // 8))
                            video_kbps = max(64, total_kbps - audio_kbps)
                            cmd.extend(["-b:v", f"{video_kbps}k", "-b:a", f"{audio_kbps}k"])
                            target_bitrate_set = True
                        elif dst_ext in ["mp3", "aac", "ogg"]:
                            audio_kbps = min(192, total_kbps) if dst_ext == "ogg" else total_kbps
                            cmd.extend(["-b:a", f"{audio_kbps}k"])
                            target_bitrate_set = True

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
                    if dst_ext in ["mp3", "aac", "ogg"] and not target_bitrate_set:
                        ab = str(options.get("audio_bitrate") or options.get("audioBitrate") or "320k").replace("kbps", "").replace("k", "")
                        bitrate = min(int(ab), 192) if dst_ext == "ogg" and ab.isdigit() else ab
                        cmd.extend(["-b:a", f"{bitrate}k"])

                cmd.append(out_path)
                res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode == 0 and os.path.exists(out_path):
                    return
                else:
                    err = res.stderr.decode("utf-8", errors="ignore")
                    raise RuntimeError(f"FFmpeg conversion failed: {err[-600:]}")

        # 6. PDF -> TXT (PyMuPDF / RapidOCR / PyPDF)
        if src_ext == "pdf" and dst_ext == "txt":
            ocr_res = self.ocr_pdf(src_path, page_range="all", dpi=150, force_ocr=options.get("force_ocr", False))
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(ocr_res.get("text", ""))
            return

        # 7. PDF -> HTML (PyPDF)
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

        # 8. DOCX -> TXT (python-docx)
        if src_ext == "docx" and dst_ext == "txt":
            if not HAS_DOCX:
                raise RuntimeError("python-docx library is required for DOCX conversion.")
            doc = docx.Document(src_path)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("\n\n".join([p.text for p in doc.paragraphs if p.text]))
            return

        # 9. DOCX -> HTML (python-docx)
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

        # 10. TXT <-> JSON
        if src_ext in ["txt", "text"] and dst_ext == "json":
            with open(src_path, "r", encoding="utf-8", errors="ignore") as tf:
                content = tf.read()
            try:
                parsed = json.loads(content)
                with open(out_path, "w", encoding="utf-8") as jf:
                    json.dump(parsed, jf, indent=2)
            except Exception:
                with open(out_path, "w", encoding="utf-8") as jf:
                    json.dump({"filename": Path(src_path).name, "content": content, "lines": content.splitlines()}, jf, indent=2)
            return

        if src_ext == "json" and dst_ext in ["txt", "text"]:
            with open(src_path, "r", encoding="utf-8", errors="ignore") as jf:
                data = json.load(jf)
            with open(out_path, "w", encoding="utf-8") as tf:
                if isinstance(data, dict) and "content" in data:
                    tf.write(str(data["content"]))
                else:
                    tf.write(json.dumps(data, indent=2))
            return

        # 10a. Tabular data conversions (CSV, TSV, JSON, XLSX)
        if ((src_ext in ["csv", "tsv", "xlsx"] and dst_ext in ["csv", "tsv", "json", "xlsx", "txt", "pdf"])
                or (src_ext == "json" and dst_ext in ["csv", "tsv", "xlsx"])):
            if not HAS_PANDAS:
                raise RuntimeError("Pandas is required for table conversions.")
            sep = "\t" if src_ext == "tsv" else ","
            if src_ext == "xlsx":
                if not HAS_OPENPYXL:
                    raise RuntimeError("openpyxl is required for XLSX conversions.")
                frame = pd.read_excel(src_path, engine="openpyxl")
            elif src_ext in ["csv", "tsv"]:
                frame = pd.read_csv(src_path, sep=sep)
            else:
                data = json.load(open(src_path, "r", encoding="utf-8"))
                frame = pd.DataFrame(data if isinstance(data, list) else [data])
            if dst_ext == "xlsx":
                frame.to_excel(out_path, index=False, engine="openpyxl")
            elif dst_ext == "json":
                frame.to_json(out_path, orient="records", indent=2)
            elif dst_ext in ["csv", "tsv"]:
                frame.to_csv(out_path, index=False, sep="\t" if dst_ext == "tsv" else ",")
            elif dst_ext in ["txt", "pdf"]:
                if dst_ext == "txt":
                    with open(out_path, "w", encoding="utf-8") as out:
                        out.write(frame.to_string(index=False))
                else:
                    if not HAS_PYMUPDF:
                        raise RuntimeError("PyMuPDF is required for table to PDF conversion.")
                    text = frame.to_string(index=False)
                    doc = pymupdf.open()
                    page = doc.new_page(width=595, height=842)
                    page.insert_textbox(pymupdf.Rect(36, 36, 559, 806), text, fontsize=8, fontname="cour")
                    doc.save(out_path)
                    doc.close()
            return

        # 11. PPTX / PPT -> PDF
        if src_ext == "pptx" and dst_ext == "pdf":
            try:
                _pptx_to_pdf_native(src_path, out_path)
                if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                    return
            except Exception as e_native:
                print(f"[Native PPTX->PDF Warning]: {e_native}")
            raise RuntimeError("Failed to convert presentation to PDF.")

        # 12. PPTX / PPT -> TXT
        if src_ext in ["pptx", "ppt"] and dst_ext == "txt":
            if not HAS_PPTX:
                raise RuntimeError("python-pptx is required to extract text from PPTX.")
            prs = Presentation(src_path)
            output_lines = []
            for i, slide in enumerate(prs.slides):
                output_lines.append(f"--- Slide {i + 1} ---")
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for p in shape.text_frame.paragraphs:
                            t = p.text.strip()
                            if t:
                                prefix = "  • " if (p.level and p.level > 0) else ""
                                output_lines.append(f"{prefix}{t}")
                    elif shape.has_table:
                        for row in shape.table.rows:
                            output_lines.append(" | ".join([c.text.strip().replace("\n", " ") for c in row.cells]))
                output_lines.append("")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("\n".join(output_lines))
            return

        # 13. PPTX / PPT -> HTML
        if src_ext in ["pptx", "ppt"] and dst_ext == "html":
            if not HAS_PPTX:
                raise RuntimeError("python-pptx is required to convert PPTX to HTML.")
            prs = Presentation(src_path)
            html_parts = [
                "<!DOCTYPE html><html><head><meta charset='utf-8'>",
                f"<title>{html.escape(stem)} - Presentation</title>",
                "<style>",
                "body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;padding:2rem;margin:0;}",
                ".slide-deck{max-width:960px;margin:auto;display:flex;flex-direction:column;gap:2rem;}",
                ".slide-card{background:#1e293b;border:1px solid #334155;border-radius:1rem;padding:2.5rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);position:relative;min-height:300px;}",
                ".slide-number{position:absolute;top:1rem;right:1.5rem;font-size:0.75rem;color:#94a3b8;font-weight:700;}",
                "h2{color:#38bdf8;margin-top:0;font-size:1.75rem;border-bottom:1px solid #334155;padding-bottom:0.75rem;}",
                "p{line-height:1.6;font-size:1.05rem;color:#e2e8f0;margin:0.5rem 0;}",
                "ul{margin:1rem 0;padding-left:1.5rem;}",
                "li{margin-bottom:0.5rem;line-height:1.5;color:#cbd5e1;}",
                "table{width:100%;border-collapse:collapse;margin:1rem 0;}",
                "th,td{border:1px solid #475569;padding:0.6rem;text-align:left;font-size:0.9rem;}",
                "th{background:#334155;color:#38bdf8;}",
                "</style></head><body><div class='slide-deck'>"
            ]
            for i, slide in enumerate(prs.slides):
                html_parts.append(f"<div class='slide-card'><span class='slide-number'>Slide {i+1}</span>")
                title_txt = ""
                try:
                    if slide.shapes.title and slide.shapes.title.text.strip():
                        title_txt = slide.shapes.title.text.strip()
                        html_parts.append(f"<h2>{html.escape(title_txt)}</h2>")
                except Exception:
                    pass

                for shape in slide.shapes:
                    if shape == slide.shapes.title:
                        continue
                    if shape.has_text_frame:
                        has_bullets = any(p.level and p.level > 0 for p in shape.text_frame.paragraphs)
                        if has_bullets:
                            html_parts.append("<ul>")
                            for p in shape.text_frame.paragraphs:
                                t = p.text.strip()
                                if t:
                                    html_parts.append(f"<li>{html.escape(t)}</li>")
                            html_parts.append("</ul>")
                        else:
                            for p in shape.text_frame.paragraphs:
                                t = p.text.strip()
                                if t and t != title_txt:
                                    html_parts.append(f"<p>{html.escape(t)}</p>")
                    elif shape.has_table:
                        html_parts.append("<table>")
                        for r_idx, row in enumerate(shape.table.rows):
                            html_parts.append("<tr>")
                            tag = "th" if r_idx == 0 else "td"
                            for cell in row.cells:
                                c_txt = html.escape(cell.text.strip().replace("\n", " "))
                                html_parts.append(f"<{tag}>{c_txt}</{tag}>")
                            html_parts.append("</tr>")
                        html_parts.append("</table>")
                html_parts.append("</div>")
            html_parts.append("</div></body></html>")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write("\n".join(html_parts))
            return

        # 14. PPTX / PPT -> DOCX
        if src_ext in ["pptx", "ppt"] and dst_ext == "docx":
            if not HAS_PPTX or not HAS_DOCX:
                raise RuntimeError("python-pptx and python-docx libraries are required.")
            prs = Presentation(src_path)
            new_doc = docx.Document()
            new_doc.add_heading(f"{stem} - Slide Presentation", level=0)
            for i, slide in enumerate(prs.slides):
                title_txt = ""
                try:
                    if slide.shapes.title and slide.shapes.title.text.strip():
                        title_txt = slide.shapes.title.text.strip()
                except Exception:
                    pass

                slide_title = title_txt if title_txt else f"Slide {i + 1}"
                new_doc.add_heading(slide_title, level=2)

                for shape in slide.shapes:
                    if shape == slide.shapes.title:
                        continue
                    if shape.has_text_frame:
                        for p in shape.text_frame.paragraphs:
                            t = p.text.strip()
                            if t and t != title_txt:
                                if p.level and p.level > 0:
                                    new_doc.add_paragraph(t, style="List Bullet")
                                else:
                                    new_doc.add_paragraph(t)
                    elif shape.has_table:
                        tbl = shape.table
                        table = new_doc.add_table(rows=len(tbl.rows), cols=len(tbl.columns))
                        table.style = 'Table Grid'
                        for r_idx, row in enumerate(tbl.rows):
                            for c_idx, cell in enumerate(row.cells):
                                table.cell(r_idx, c_idx).text = cell.text.strip()
                new_doc.add_paragraph()
            new_doc.save(out_path)
            return

        # 15. PPTX / PPT -> Images (PNG, JPG, JPEG, WEBP)
        if src_ext in ["pptx", "ppt"] and dst_ext in ["png", "jpg", "jpeg", "webp"]:
            temp_pdf = os.path.join(tempfile.gettempdir(), f"omni_pptx_{uuid.uuid4().hex[:8]}.pdf")
            try:
                self._convert_native(src_path, temp_pdf, src_ext, "pdf", options, stem)
                self._convert_native(temp_pdf, out_path, "pdf", dst_ext, options, stem)
            finally:
                if os.path.exists(temp_pdf):
                    try:
                        os.remove(temp_pdf)
                    except Exception:
                        pass
            return

        # 16. DOCX / DOC -> PDF
        if src_ext == "docx" and dst_ext == "pdf":
            _docx_to_pdf_native(src_path, out_path)
            return

        # 17. DOCX / DOC -> Images (PNG, JPG, JPEG, WEBP)
        if src_ext in ["docx", "doc"] and dst_ext in ["png", "jpg", "jpeg", "webp"]:
            temp_pdf = os.path.join(tempfile.gettempdir(), f"omni_docx_{uuid.uuid4().hex[:8]}.pdf")
            try:
                self._convert_native(src_path, temp_pdf, src_ext, "pdf", options, stem)
                self._convert_native(temp_pdf, out_path, "pdf", dst_ext, options, stem)
            finally:
                if os.path.exists(temp_pdf):
                    try:
                        os.remove(temp_pdf)
                    except Exception:
                        pass
            return

        # 18. PDF -> DOCX
        if src_ext == "pdf" and dst_ext == "docx":
            if HAS_PDF2DOCX:
                try:
                    cv = PDF2DocxConverter(src_path)
                    cv.convert(out_path)
                    cv.close()
                    if os.path.exists(out_path) and os.path.getsize(out_path) > 100:
                        return
                except Exception as e:
                    print(f"[pdf2docx Fallback Warning]: {e}")

            if not HAS_DOCX:
                raise RuntimeError("python-docx library is required for PDF to DOCX conversion.")

            reader = pymupdf.open(src_path) if HAS_PYMUPDF else None
            out_doc = docx.Document()

            if reader:
                for i, page in enumerate(reader):
                    if i > 0:
                        out_doc.add_page_break()
                    txt = page.get_text()
                    for line in txt.splitlines():
                        if line.strip():
                            out_doc.add_paragraph(line.strip())
                reader.close()
            else:
                pdf_read = pypdf.PdfReader(src_path)
                for i, page in enumerate(pdf_read.pages):
                    if i > 0:
                        out_doc.add_page_break()
                    txt = page.extract_text() or ""
                    for line in txt.splitlines():
                        if line.strip():
                            out_doc.add_paragraph(line.strip())
            out_doc.save(out_path)
            return

        # 19. HTML / HTM -> PDF
        if src_ext in ["html", "htm"] and dst_ext == "pdf":
            if not HAS_PYMUPDF:
                raise RuntimeError("PyMuPDF is required for HTML to PDF conversion.")
            doc = pymupdf.open(src_path)
            pdf_bytes = doc.convert_to_pdf()
            pdf_doc = pymupdf.open("pdf", pdf_bytes)
            pdf_doc.save(out_path)
            doc.close()
            pdf_doc.close()
            return

        # 20. HTML / HTM -> TXT
        if src_ext in ["html", "htm"] and dst_ext == "txt":
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()
            clean_text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', html_content, flags=re.I)
            clean_text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', clean_text, flags=re.I)
            clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
            clean_text = html.unescape(clean_text)
            clean_text = "\n".join(line.strip() for line in clean_text.splitlines() if line.strip())
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(clean_text)
            return

        # 21. HTML / HTM -> DOCX
        if src_ext in ["html", "htm"] and dst_ext == "docx":
            if not HAS_DOCX:
                raise RuntimeError("python-docx is required for HTML to DOCX conversion.")
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()
            clean_text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', html_content, flags=re.I)
            clean_text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', clean_text, flags=re.I)
            clean_text = re.sub(r'<[^>]+>', '\n', clean_text)
            clean_text = html.unescape(clean_text)
            out_doc = docx.Document()
            for line in clean_text.splitlines():
                if line.strip():
                    out_doc.add_paragraph(line.strip())
            out_doc.save(out_path)
            return

        # 22. TXT / TEXT / MD -> DOCX
        if src_ext in ["txt", "text", "md"] and dst_ext == "docx":
            if not HAS_DOCX:
                raise RuntimeError("python-docx is required for TXT to DOCX conversion.")
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            out_doc = docx.Document()
            for line in content.splitlines():
                l = line.strip()
                if not l:
                    continue
                if src_ext == "md":
                    if l.startswith("# "):
                        out_doc.add_heading(l[2:], level=1)
                    elif l.startswith("## "):
                        out_doc.add_heading(l[3:], level=2)
                    elif l.startswith("### "):
                        out_doc.add_heading(l[4:], level=3)
                    elif l.startswith("- ") or l.startswith("* "):
                        out_doc.add_paragraph(l[2:], style="List Bullet")
                    else:
                        out_doc.add_paragraph(l)
                else:
                    out_doc.add_paragraph(l)
            out_doc.save(out_path)
            return

        # 23. SVG -> PDF / PNG / JPG / WEBP
        if src_ext == "svg" and dst_ext in ["pdf", "png", "jpg", "jpeg", "webp"]:
            if not HAS_PYMUPDF:
                raise RuntimeError("PyMuPDF is required for SVG conversion.")
            doc = pymupdf.open(src_path)
            pdf_bytes = doc.convert_to_pdf()
            pdf_doc = pymupdf.open("pdf", pdf_bytes)
            if dst_ext == "pdf":
                pdf_doc.save(out_path)
            else:
                pix = pdf_doc[0].get_pixmap(dpi=150)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                fmt = "JPEG" if dst_ext in ["jpg", "jpeg"] else dst_ext.upper()
                img.save(out_path, format=fmt)
            doc.close()
            pdf_doc.close()
            return

        # 24. YAML / YML <-> JSON
        if src_ext in ["yaml", "yml"] and dst_ext == "json":
            if not HAS_YAML:
                raise RuntimeError("PyYAML library is required for YAML conversion.")
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                data = yaml.safe_load(f)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
            return

        if src_ext == "json" and dst_ext in ["yaml", "yml"]:
            if not HAS_YAML:
                raise RuntimeError("PyYAML library is required for YAML conversion.")
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
            with open(out_path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, default_flow_style=False, sort_keys=False)
            return

        # 25. XML -> JSON
        if src_ext == "xml" and dst_ext == "json":
            import xml.etree.ElementTree as ET
            def _elem_to_dict(elem):
                d = {elem.tag: {}}
                children = list(elem)
                if children:
                    dd = {}
                    for dc in map(_elem_to_dict, children):
                        for k, v in dc.items():
                            if k in dd:
                                if not isinstance(dd[k], list):
                                    dd[k] = [dd[k]]
                                dd[k].append(v)
                            else:
                                dd[k] = v
                    d = {elem.tag: dd}
                if elem.attrib:
                    d[elem.tag]["@attributes"] = elem.attrib
                if elem.text and elem.text.strip():
                    if children or elem.attrib:
                        d[elem.tag]["#text"] = elem.text.strip()
                    else:
                        d[elem.tag] = elem.text.strip()
                return d
            try:
                tree = ET.parse(src_path)
                root = tree.getroot()
                dict_data = _elem_to_dict(root)
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(dict_data, f, indent=2)
            except Exception as exc:
                raise ValueError(f"Failed to parse XML: {exc}")
            return

        # 26. CODE FILES -> PDF / TXT / HTML
        if src_ext in ["py", "js", "ts", "java", "c", "cpp", "rs", "go", "sql", "tsv"] and dst_ext in ["pdf", "txt", "html"]:
            with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
                code_content = f.read()
            if dst_ext == "txt":
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(code_content)
                return
            elif dst_ext == "html":
                escaped = html.escape(code_content)
                html_code = f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>{html.escape(stem)}</title><style>body{{background:#0f172a;color:#e2e8f0;padding:2rem;font-family:monospace;}}pre{{background:#1e293b;padding:1.5rem;border-radius:0.75rem;overflow:auto;}}</style></head><body><pre><code>{escaped}</code></pre></body></html>"
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(html_code)
                return
            elif dst_ext == "pdf":
                if not HAS_PYMUPDF:
                    raise RuntimeError("PyMuPDF is required for code to PDF conversion.")
                doc = pymupdf.open()
                lines = code_content.splitlines() or [""]
                lines_per_page = 55
                for p_start in range(0, max(1, len(lines)), lines_per_page):
                    page = doc.new_page(width=595, height=842)
                    page_text = "\n".join(lines[p_start:p_start + lines_per_page])
                    page.insert_text((40, 50), page_text, fontsize=8.5, fontname="cour")
                doc.save(out_path)
                doc.close()
                return

        # If completely unsupported, raise ValueError instead of creating corrupted copies
        raise ValueError(f"Direct conversion from '.{src_ext}' to '.{dst_ext}' is not supported.")

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
        writer = pypdf.PdfWriter()
        passwords = passwords or []
        for i, path in enumerate(pdf_paths):
            pwd = passwords[i] if i < len(passwords) else ""
            reader = pypdf.PdfReader(path)
            self._handle_encrypted_reader(reader, pwd)
            writer.append(reader)
        with open(out_path, "wb") as f:
            writer.write(f)
        writer.close()

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

        # PyMuPDF can recompress and downsample the embedded images that make
        # up most large/scanned PDFs. pypdf's stream compression alone often
        # leaves those image bytes unchanged.
        if HAS_PYMUPDF:
            doc = pymupdf.open(pdf_path)
            try:
                if doc.needs_pass and (not password or doc.authenticate(password) <= 0):
                    raise ValueError("PDF is password protected. Please provide the correct password.")

                image_settings = {
                    "low": (200, 80),
                    "medium": (150, 60),
                    "high": (96, 45),
                }
                dpi_target, quality = image_settings.get(level, image_settings["medium"])
                doc.rewrite_images(dpi_target=dpi_target, quality=quality)
                doc.save(
                    out_path,
                    garbage=4,
                    deflate=True,
                    deflate_images=True,
                    deflate_fonts=True,
                    use_objstms=1,
                )
                return
            finally:
                doc.close()

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

    def extract_ocr_from_image(self, image_input: str | bytes | Image.Image) -> Dict[str, Any]:
        """Runs OCR on an image (path, bytes, or PIL Image) and returns text and line-level coordinates."""
        if isinstance(image_input, (str, Path)):
            img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input))
        else:
            img = image_input

        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        lines = []
        full_text = ""
        avg_confidence = 1.0

        if HAS_RAPIDOCR and RAPID_OCR_INSTANCE is not None:
            import numpy as np
            img_np = np.array(img)
            ocr_res, _ = RAPID_OCR_INSTANCE(img_np)
            if ocr_res:
                confidences = []
                for item in ocr_res:
                    text_str = str(item[1]).strip()
                    try:
                        score = float(item[2])
                    except Exception:
                        score = 0.9
                    if text_str:
                        lines.append({
                            "text": text_str,
                            "box": item[0] if isinstance(item[0], list) else [],
                            "confidence": round(score, 3)
                        })
                        confidences.append(score)
                if confidences:
                    avg_confidence = round(sum(confidences) / len(confidences), 3)
                full_text = "\n".join(l["text"] for l in lines)
        elif HAS_PYTESSERACT:
            full_text = pytesseract.image_to_string(img)
            lines = [{"text": l, "confidence": 0.85} for l in full_text.splitlines() if l.strip()]

        return {
            "text": full_text,
            "lines": lines,
            "confidence": avg_confidence,
            "line_count": len(lines)
        }

    def ocr_pdf(self, pdf_path_or_bytes: str | bytes, page_range: str = "all", dpi: int = 150, force_ocr: bool = False, password: str = "") -> Dict[str, Any]:
        """Extracts text from PDF pages using PyMuPDF and RapidOCR. Falls back to PyPDF."""
        t0 = time.time()
        pages_data = []
        all_text_list = []

        if isinstance(pdf_path_or_bytes, bytes):
            doc = pymupdf.open(stream=pdf_path_or_bytes, filetype="pdf") if HAS_PYMUPDF else None
            pypdf_bytes = io.BytesIO(pdf_path_or_bytes)
        else:
            doc = pymupdf.open(pdf_path_or_bytes) if HAS_PYMUPDF else None
            pypdf_bytes = pdf_path_or_bytes

        if doc is not None and password:
            doc.authenticate(password)

        total_pages = len(doc) if doc else (len(pypdf.PdfReader(pypdf_bytes).pages) if HAS_PYPDF else 0)
        target_indices = self.parse_page_ranges(page_range, total_pages) if total_pages > 0 else []

        overall_confidences = []

        if HAS_PYMUPDF and doc is not None:
            for idx in target_indices:
                page = doc[idx]
                digital_text = page.get_text().strip()

                # If digital text exists and force_ocr is False, use high-speed digital text
                if digital_text and not force_ocr and len(digital_text) > 15:
                    page_text = digital_text
                    confidence = 1.0
                    method = "digital"
                    lines = [{"text": l, "confidence": 1.0} for l in page_text.splitlines() if l.strip()]
                else:
                    # Render raster image from PDF page for OCR
                    pix = page.get_pixmap(dpi=dpi)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_res = self.extract_ocr_from_image(img)
                    page_text = ocr_res["text"] or digital_text
                    confidence = ocr_res["confidence"]
                    method = "ocr" if ocr_res["text"] else "digital_fallback"
                    lines = ocr_res["lines"]

                overall_confidences.append(confidence)
                pages_data.append({
                    "page_number": idx + 1,
                    "text": page_text,
                    "confidence": confidence,
                    "method": method,
                    "line_count": len(lines),
                    "lines": lines
                })
                all_text_list.append(f"--- PAGE {idx + 1} ---\n{page_text}")

            doc.close()
        elif HAS_PYPDF:
            reader = pypdf.PdfReader(pypdf_bytes)
            self._handle_encrypted_reader(reader, password)
            for idx in target_indices:
                page = reader.pages[idx]
                page_text = page.extract_text() or ""
                method = "digital"
                confidence = 1.0

                if not page_text and len(page.images) > 0:
                    img_texts = []
                    for img_obj in page.images:
                        res = self.extract_ocr_from_image(img_obj.data)
                        if res["text"]:
                            img_texts.append(res["text"])
                    if img_texts:
                        page_text = "\n".join(img_texts)
                        method = "pypdf_ocr"
                        confidence = 0.9

                pages_data.append({
                    "page_number": idx + 1,
                    "text": page_text,
                    "confidence": confidence,
                    "method": method,
                    "line_count": len(page_text.splitlines()),
                    "lines": [{"text": l, "confidence": confidence} for l in page_text.splitlines() if l.strip()]
                })
                all_text_list.append(f"--- PAGE {idx + 1} ---\n{page_text}")

        elapsed = time.time() - t0
        avg_conf = round(sum(overall_confidences) / max(1, len(overall_confidences)), 3) if overall_confidences else 1.0
        combined_text = "\n\n".join(all_text_list)

        return {
            "success": True,
            "total_pages": total_pages,
            "processed_pages": len(pages_data),
            "text": combined_text,
            "confidence": avg_conf,
            "pages": pages_data,
            "elapsed": round(elapsed, 3)
        }

    def ocr_document(self, file_path_or_bytes: str | bytes, filename: str, page_range: str = "all", force_ocr: bool = False, password: str = "") -> Dict[str, Any]:
        """Unified OCR dispatcher for PDF documents and image files."""
        ext = Path(filename).suffix.lower().lstrip(".")
        if ext == "pdf":
            return self.ocr_pdf(file_path_or_bytes, page_range=page_range, force_ocr=force_ocr, password=password)
        elif ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif"]:
            t0 = time.time()
            ocr_res = self.extract_ocr_from_image(file_path_or_bytes)
            elapsed = time.time() - t0
            return {
                "success": True,
                "total_pages": 1,
                "processed_pages": 1,
                "text": ocr_res["text"],
                "confidence": ocr_res["confidence"],
                "pages": [{
                    "page_number": 1,
                    "text": ocr_res["text"],
                    "confidence": ocr_res["confidence"],
                    "method": "image_ocr",
                    "line_count": ocr_res["line_count"],
                    "lines": ocr_res["lines"]
                }],
                "elapsed": round(elapsed, 3)
            }
    def pdf_merge(self, files: List[Tuple[str, bytes] | str], out_path: Optional[str] = None, passwords: Optional[List[str]] = None) -> str:
        """High-level programmatic wrapper to merge multiple PDF files."""
        temp_dir = tempfile.mkdtemp(prefix="omni_merge_")
        dest = out_path or os.path.join(temp_dir, "OmniConverter_Merged.pdf")
        paths = []
        for item in files:
            if isinstance(item, str):
                paths.append(item)
            elif isinstance(item, tuple):
                p = os.path.join(temp_dir, item[0])
                with open(p, "wb") as f:
                    f.write(item[1])
                paths.append(p)
        self.merge_pdfs(paths, dest, passwords)
        return dest

    def pdf_split(self, file_path_or_bytes: str | bytes, page_range: str = "all", mode: str = "single_pdf", out_path: Optional[str] = None, password: str = "") -> str:
        """High-level programmatic wrapper to split PDF pages."""
        temp_dir = tempfile.mkdtemp(prefix="omni_split_")
        if isinstance(file_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, "input.pdf")
            with open(src_path, "wb") as f:
                f.write(file_path_or_bytes)
        else:
            src_path = str(file_path_or_bytes)
        ext = ".zip" if mode == "zip" else ".pdf"
        dest = out_path or os.path.join(temp_dir, f"split_output{ext}")
        return self.split_pdf(src_path, page_range, dest, mode, password)

    def pdf_compress(self, file_path_or_bytes: str | bytes, level: str = "medium", out_path: Optional[str] = None, password: str = "") -> str:
        """High-level programmatic wrapper to compress PDF size."""
        temp_dir = tempfile.mkdtemp(prefix="omni_compress_")
        if isinstance(file_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, "input.pdf")
            with open(src_path, "wb") as f:
                f.write(file_path_or_bytes)
        else:
            src_path = str(file_path_or_bytes)
        dest = out_path or os.path.join(temp_dir, "compressed_output.pdf")
        self.compress_pdf(src_path, dest, level, password)
        return dest

    def pdf_protect(self, file_path_or_bytes: str | bytes, password: str, out_path: Optional[str] = None) -> str:
        """High-level programmatic wrapper to encrypt PDF with password."""
        temp_dir = tempfile.mkdtemp(prefix="omni_protect_")
        if isinstance(file_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, "input.pdf")
            with open(src_path, "wb") as f:
                f.write(file_path_or_bytes)
        else:
            src_path = str(file_path_or_bytes)
        dest = out_path or os.path.join(temp_dir, "protected_output.pdf")
        self.protect_pdf(src_path, dest, password)
        return dest

    def pdf_unlock(self, file_path_or_bytes: str | bytes, password: str, out_path: Optional[str] = None) -> str:
        """High-level programmatic wrapper to decrypt protected PDF."""
        temp_dir = tempfile.mkdtemp(prefix="omni_unlock_")
        if isinstance(file_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, "input.pdf")
            with open(src_path, "wb") as f:
                f.write(file_path_or_bytes)
        else:
            src_path = str(file_path_or_bytes)
        dest = out_path or os.path.join(temp_dir, "unlocked_output.pdf")
        self.unlock_pdf(src_path, dest, password)
        return dest

    def pdf_rotate(self, file_path_or_bytes: str | bytes, angle: int = 90, page_range: str = "all", out_path: Optional[str] = None, password: str = "") -> str:
        """High-level programmatic wrapper to rotate PDF pages."""
        temp_dir = tempfile.mkdtemp(prefix="omni_rotate_")
        if isinstance(file_path_or_bytes, bytes):
            src_path = os.path.join(temp_dir, "input.pdf")
            with open(src_path, "wb") as f:
                f.write(file_path_or_bytes)
        else:
            src_path = str(file_path_or_bytes)
        dest = out_path or os.path.join(temp_dir, "rotated_output.pdf")
        self.rotate_pdf(src_path, dest, angle, page_range, password)
        return dest

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


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="omniconverter",
        description="OmniConverter CLI: Universal File Converter, PDF Suite & Neural OCR"
    )
    parser.add_argument("files", nargs="+", help="Input file path(s)")
    parser.add_argument("-t", "--target", help="Target conversion format (e.g. pdf, png, webp, mp3, docx)")
    parser.add_argument("-o", "--output", help="Destination file or directory path")
    parser.add_argument("--merge", action="store_true", help="Merge multiple PDF inputs into a single document")
    parser.add_argument("--split", metavar="RANGE", help="Split PDF pages (e.g. 1-3, odd)")
    parser.add_argument("--compress", choices=["low", "medium", "high"], help="Compress PDF size")
    parser.add_argument("--protect", metavar="PASSWORD", help="Encrypt PDF with password")
    parser.add_argument("--unlock", metavar="PASSWORD", help="Decrypt password-protected PDF")
    parser.add_argument("--rotate", type=int, choices=[90, 180, 270], help="Rotate PDF pages clockwise")
    parser.add_argument("--ocr", action="store_true", help="Extract text via RapidOCR neural engine")

    args = parser.parse_args()

    try:
        # 1. MERGE PDFs
        if args.merge:
            pdf_data = [(Path(f).name, open(f, "rb").read()) for f in args.files]
            out_path = converter_engine.pdf_merge(pdf_data)
            dest = args.output or "merged_output.pdf"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Merged {len(pdf_data)} PDFs -> {dest}")

        # 2. SPLIT PDF
        elif args.split:
            fpath = args.files[0]
            out_path = converter_engine.pdf_split(open(fpath, "rb").read(), page_range=args.split)
            dest = args.output or f"split_{Path(fpath).name}"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Split PDF ({args.split}) -> {dest}")

        # 3. COMPRESS PDF
        elif args.compress:
            fpath = args.files[0]
            out_path = converter_engine.pdf_compress(open(fpath, "rb").read(), level=args.compress)
            dest = args.output or f"compressed_{Path(fpath).name}"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Compressed PDF ({args.compress}) -> {dest}")

        # 4. PROTECT PDF
        elif args.protect:
            fpath = args.files[0]
            out_path = converter_engine.pdf_protect(open(fpath, "rb").read(), password=args.protect)
            dest = args.output or f"protected_{Path(fpath).name}"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Protected PDF -> {dest}")

        # 5. UNLOCK PDF
        elif args.unlock:
            fpath = args.files[0]
            out_path = converter_engine.pdf_unlock(open(fpath, "rb").read(), password=args.unlock)
            dest = args.output or f"unlocked_{Path(fpath).name}"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Unlocked PDF -> {dest}")

        # 6. ROTATE PDF
        elif args.rotate:
            fpath = args.files[0]
            out_path = converter_engine.pdf_rotate(open(fpath, "rb").read(), angle=args.rotate)
            dest = args.output or f"rotated_{Path(fpath).name}"
            shutil.copyfile(out_path, dest)
            print(f"[SUCCESS] Rotated PDF ({args.rotate} deg) -> {dest}")

        # 7. OCR TEXT EXTRACTION
        elif args.ocr:
            fpath = args.files[0]
            ocr_res = converter_engine.ocr_document(open(fpath, "rb").read(), Path(fpath).name)
            if args.output:
                with open(args.output, "w", encoding="utf-8") as out_f:
                    out_f.write(ocr_res["text"])
                print(f"[SUCCESS] OCR text extracted to {args.output} ({ocr_res['confidence'] * 100:.1f}% confidence)")
            else:
                print(ocr_res["text"])

        # 8. STANDARD CONVERSION
        elif args.target:
            for fpath in args.files:
                fname = Path(fpath).name
                res = converter_engine.convert_file(open(fpath, "rb").read(), fname, args.target)
                if res.success:
                    dest = args.output or res.filename
                    if os.path.isdir(dest):
                        dest = os.path.join(dest, res.filename)
                    shutil.copyfile(res.output_path, dest)
                    print(f"[SUCCESS] Converted {fname} -> {dest} in {res.elapsed}s")
                else:
                    print(f"[ERROR] Failed to convert {fname}: {res.error}", file=sys.stderr)

        else:
            parser.print_help()

    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        sys.exit(1)



