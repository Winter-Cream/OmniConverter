"""
OmniConverter - Backend API Pytest Test Suite
Covers key endpoints: /api/health, /api/stats, /api/convert, /api/convert/zip,
/api/pdf/merge, /api/pdf/split, /api/pdf/compress, /api/pdf/protect, /api/pdf/unlock, /api/pdf/rotate.
"""

import io
import pytest
from fastapi.testclient import TestClient

from server import app
from pypdf import PdfWriter, PdfReader

client = TestClient(app)


def create_sample_pdf_bytes() -> bytes:
    """Helper utility to generate a minimal valid 1-page PDF document in memory."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_health_check_endpoint():
    """Verify GET /api/health endpoint returns online status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "has_ffmpeg" in data
    assert "version" in data


def test_stats_endpoint():
    """Verify GET /api/stats endpoint returns database statistics dictionary."""
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "filesConverted" in data
    assert "bytesProcessed" in data


def test_single_file_conversion_endpoint():
    """Verify POST /api/convert endpoint converts text input to target format."""
    file_bytes = b"Sample text content for conversion test."
    response = client.post(
        "/api/convert",
        files={"file": ("test.txt", file_bytes, "text/plain")},
        data={"target_format": "json"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] in ["application/json", "application/octet-stream"]


def test_batch_zip_conversion_endpoint():
    """Verify POST /api/convert/zip endpoint processes batch files and returns ZIP archive."""
    file1 = ("doc1.txt", b"First doc text", "text/plain")
    file2 = ("doc2.txt", b"Second doc text", "text/plain")
    response = client.post(
        "/api/convert/zip",
        files=[("files", file1), ("files", file2)],
        data={"target_format": "json"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"


def test_pdf_merge_endpoint():
    """Verify POST /api/pdf/merge merges two PDF documents."""
    pdf1 = create_sample_pdf_bytes()
    pdf2 = create_sample_pdf_bytes()
    response = client.post(
        "/api/pdf/merge",
        files=[
            ("files", ("sample1.pdf", pdf1, "application/pdf")),
            ("files", ("sample2.pdf", pdf2, "application/pdf"))
        ]
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    
    # Validate merged PDF output
    merged_reader = PdfReader(io.BytesIO(response.content))
    assert len(merged_reader.pages) == 2


def test_pdf_split_endpoint():
    """Verify POST /api/pdf/split extracts PDF pages."""
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/pdf/split",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        data={"page_range": "1", "mode": "single_pdf"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_pdf_compress_endpoint():
    """Verify POST /api/pdf/compress optimizes PDF size."""
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/pdf/compress",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        data={"level": "medium"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_pdf_protect_and_unlock_endpoint():
    """Verify POST /api/pdf/protect encrypts PDF and /api/pdf/unlock decrypts it."""
    pdf_bytes = create_sample_pdf_bytes()
    password = "SecretTestPassword123"

    # Encrypt
    prot_resp = client.post(
        "/api/pdf/protect",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        data={"password": password}
    )
    assert prot_resp.status_code == 200
    encrypted_bytes = prot_resp.content

    # Decrypt (Unlock)
    unl_resp = client.post(
        "/api/pdf/unlock",
        files={"file": ("encrypted.pdf", encrypted_bytes, "application/pdf")},
        data={"password": password}
    )
    assert unl_resp.status_code == 200
    assert unl_resp.headers["content-type"] == "application/pdf"


def test_pdf_rotate_endpoint():
    """Verify POST /api/pdf/rotate rotates PDF pages."""
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/pdf/rotate",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        data={"angle": 90, "page_range": "all"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_pdf_split_zip_mode_endpoint():
    """Verify POST /api/pdf/split with mode='zip' returns a valid zip archive containing individual pages."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    response = client.post(
        "/api/pdf/split",
        files={"file": ("multipage.pdf", pdf_bytes, "application/pdf")},
        data={"page_range": "all", "mode": "zip"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"


def test_image_conversion_endpoint():
    """Verify POST /api/convert with image input and options."""
    from PIL import Image
    img = Image.new("RGBA", (50, 50), color=(0, 128, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    response = client.post(
        "/api/convert",
        files={"file": ("sample.png", png_bytes, "image/png")},
        data={"target_format": "webp", "quality": 80}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] in ["image/webp", "application/octet-stream"]


def test_ai_tts_endpoint():
    """Verify POST /api/ai/tts returns audio/wav data."""
    response = client.post(
        "/api/ai/tts",
        data={"text": "OmniConverter test speech", "voice": "female"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert len(response.content) > 1000


def test_watch_folder_config_endpoint():
    """Verify POST /api/watch-folder/config configures and updates the daemon state."""
    response = client.post(
        "/api/watch-folder/config",
        data={
            "enabled": False,
            "path": "./watch_input",
            "output_path": "./watch_output",
            "target_format": "pdf"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["watchFolder"]["enabled"] is False


def test_ai_chat_endpoint():
    """Verify POST /api/ai/chat returns intelligent guidance on OmniConverter features."""
    response = client.post(
        "/api/ai/chat",
        json={"message": "How do I merge PDFs?", "provider": "builtin"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "Merge" in data["reply"]
    assert data["provider"] == "builtin"

