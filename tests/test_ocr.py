"""
OmniConverter - OCR Engine & Endpoint Pytest Test Suite
Validates optical character recognition across images, digital PDFs, scanned/raster PDFs,
and the /api/pdf/ocr and /api/ocr REST endpoints.
"""

import io
import pytest
from PIL import Image, ImageDraw
import pymupdf
from fastapi.testclient import TestClient

from server import app
from converter_engine import converter_engine

client = TestClient(app)


def create_image_with_text(text: str) -> bytes:
    """Helper creating a crisp PNG in memory containing readable text."""
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((30, 50), text, fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_scanned_pdf_bytes(text: str) -> bytes:
    """Helper generating a scanned/rasterized PDF in memory (no vector text stream)."""
    img_data = create_image_with_text(text)
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=200)
    page.insert_image(page.rect, stream=img_data)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_digital_pdf_bytes(text: str) -> bytes:
    """Helper generating a standard digital PDF with embedded text layer."""
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=200)
    page.insert_text((50, 50), text, fontsize=16)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_image_ocr_extraction():
    """Verify extract_ocr_from_image extracts text from synthetic image."""
    img_bytes = create_image_with_text("INVOICE #9988 PAID")
    res = converter_engine.extract_ocr_from_image(img_bytes)
    assert res is not None
    assert "text" in res
    assert "INVOICE" in res["text"] or "9988" in res["text"] or "PAID" in res["text"]
    assert res["confidence"] > 0.0


def test_scanned_pdf_ocr_extraction():
    """Verify ocr_pdf extracts text from scanned/raster PDF with zero digital text."""
    scanned_pdf = create_scanned_pdf_bytes("CONFIDENTIAL SPECIFICATION")
    res = converter_engine.ocr_pdf(scanned_pdf, page_range="all", dpi=150)
    assert res["success"] is True
    assert res["total_pages"] == 1
    assert "CONFIDEN" in res["text"] or "SPECIFIC" in res["text"]


def test_digital_pdf_fast_extraction():
    """Verify ocr_pdf accurately extracts digital text without error."""
    digital_pdf = create_digital_pdf_bytes("OmniConverter Digital Vector Text Layer")
    res = converter_engine.ocr_pdf(digital_pdf, page_range="all")
    assert res["success"] is True
    assert "Digital Vector Text" in res["text"]
    assert res["pages"][0]["method"] == "digital"


def test_api_pdf_ocr_json_endpoint():
    """Verify POST /api/pdf/ocr returns structured JSON with extracted text and confidence."""
    scanned_pdf = create_scanned_pdf_bytes("MEDICAL LAB REPORT 2026")
    response = client.post(
        "/api/pdf/ocr",
        files={"file": ("report.pdf", scanned_pdf, "application/pdf")},
        data={"page_range": "all", "format": "json"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "MEDICAL" in data["text"] or "REPORT" in data["text"]
    assert data["confidence"] > 0.5
    assert len(data["pages"]) == 1


def test_api_pdf_ocr_download_endpoint():
    """Verify POST /api/pdf/ocr with format=txt_download returns text/plain file."""
    scanned_pdf = create_scanned_pdf_bytes("DOWNLOADABLE OCR OUTPUT")
    response = client.post(
        "/api/pdf/ocr",
        files={"file": ("scan.pdf", scanned_pdf, "application/pdf")},
        data={"page_range": "all", "format": "txt_download"}
    )
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert len(response.text) > 0


def test_api_image_ocr_endpoint():
    """Verify POST /api/ocr endpoint supports direct image uploads (PNG/JPG)."""
    img_bytes = create_image_with_text("IMAGE OCR TEST 100")
    response = client.post(
        "/api/ocr",
        files={"file": ("test.png", img_bytes, "image/png")},
        data={"format": "json"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "IMAGE" in data["text"] or "OCR" in data["text"] or "100" in data["text"]


def test_converter_engine_scanned_pdf_to_txt():
    """Verify OmniConverterEngine automatically applies OCR when converting a scanned PDF to TXT."""
    scanned_pdf = create_scanned_pdf_bytes("AUTOCONVERT SCANNED DOC")
    res = converter_engine.convert_file(scanned_pdf, "scanned_doc.pdf", "txt")
    assert res.success is True
    with open(res.output_path, "r", encoding="utf-8") as f:
        txt_content = f.read()
    assert len(txt_content.strip()) > 0
    assert "AUTOCONVERT" in txt_content or "SCANNED" in txt_content or "DOC" in txt_content
