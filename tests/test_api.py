"""
OmniConverter - Backend API Pytest Test Suite
Covers key endpoints: /api/health, /api/stats, /api/convert, /api/convert/zip,
/api/pdf/merge, /api/pdf/split, /api/pdf/compress, /api/pdf/protect, /api/pdf/unlock, /api/pdf/rotate.
"""

import io
from pathlib import Path
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
    in_dir = str(Path("./watch_input").resolve())
    out_dir = str(Path("./watch_output").resolve())
    response = client.post(
        "/api/watch-folder/config",
        data={
            "enabled": False,
            "path": in_dir,
            "output_path": out_dir,
            "target_format": "pdf"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["watchFolder"]["enabled"] is False


def test_watch_folder_rejects_nested_paths_and_unknown_targets(tmp_path):
    input_path = tmp_path / "in"
    output_path = input_path / "out"
    nested = client.post(
        "/api/watch-folder/config",
        data={"enabled": True, "path": str(input_path), "output_path": str(output_path), "target_format": "pdf"}
    )
    assert nested.status_code == 400

    invalid_target = client.post(
        "/api/watch-folder/config",
        data={"enabled": False, "path": str(input_path), "output_path": str(tmp_path / "out"), "target_format": "unknown"}
    )
    assert invalid_target.status_code == 400


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


@pytest.mark.parametrize("provider", ["openai", "gemini", "claude", "grok", "ollama", "custom"])
def test_ai_provider_payloads_and_context(provider, monkeypatch):
    """Provider adapters build expected API requests and preserve prior chat turns."""
    captured = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            if provider == "ollama":
                body = {"message": {"content": "mock reply"}}
            elif provider == "gemini":
                body = {"candidates": [{"content": {"parts": [{"text": "mock reply"}]}}]}
            elif provider == "claude":
                body = {"content": [{"type": "text", "text": "mock reply"}]}
            elif provider in {"openai", "grok"}:
                body = {"output_text": "mock reply"}
            else:
                body = {"choices": [{"message": {"content": "mock reply"}}]}
            return __import__("json").dumps(body).encode()

    def fake_urlopen(request, timeout=30):
        captured["url"] = request.full_url
        captured["headers"] = request.headers
        captured["payload"] = __import__("json").loads(request.data.decode())
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    response = client.post("/api/ai/chat", json={
        "message": "current question",
        "provider": provider,
        "api_key": "test-key",
        "model": "test-model",
        "endpoint": "http://localhost:11434" if provider == "ollama" else "https://example.test/v1",
        "history": [
            {"role": "user", "content": "previous question"},
            {"role": "assistant", "content": "previous answer"},
            {"role": "user", "content": "current question"},
        ]
    })
    assert response.status_code == 200
    assert response.json()["reply"] == "mock reply"
    if provider != "gemini":
        assert captured["payload"]["model"] == "test-model"
    serialized = __import__("json").dumps(captured["payload"])
    assert serialized.count("current question") == 1
    assert "previous question" in serialized
    if provider == "gemini":
        assert captured["headers"].get("X-goog-api-key") == "test-key"
        assert captured["payload"]["contents"][-1]["parts"][0]["text"] == "current question"
    elif provider == "claude":
        assert captured["headers"].get("X-api-key") == "test-key"
        assert captured["payload"]["messages"][-1]["role"] == "user"
    elif provider in {"openai", "grok"}:
        assert captured["headers"].get("Authorization") == "Bearer test-key"
        assert captured["url"].endswith("/v1/responses")
    elif provider == "ollama":
        assert captured["url"].endswith("/api/chat")
    else:
        assert captured["url"].endswith("/v1/chat/completions")


@pytest.mark.parametrize("provider", ["openai", "gemini", "claude", "grok", "custom"])
def test_ai_cloud_provider_requires_api_key(provider):
    response = client.post("/api/ai/chat", json={"message": "hello", "provider": provider})
    assert response.status_code == 400


def test_formats_endpoint():
    """Verify GET /api/formats returns structured categories and target format lists."""
    response = client.get("/api/formats")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "extensions" in data
    assert "image" in data["categories"]
    assert "png" in data["extensions"]
    assert {"xlsx", "pptx", "java", "rs"}.issubset(data["extensions"])
    assert "pdf" in data["extensions"]["java"]["targets"]


def test_native_image_to_pdf_conversion():
    """Verify converting an image (PNG) to PDF produces a valid PDF."""
    from PIL import Image
    img = Image.new("RGB", (60, 60), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    response = client.post(
        "/api/convert",
        files={"file": ("red_square.png", png_bytes, "image/png")},
        data={"target_format": "pdf"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    reader = PdfReader(io.BytesIO(response.content))
    assert len(reader.pages) >= 1


def test_multipage_pdf_to_image_returns_zip():
    """A PDF with multiple pages returns a ZIP of page images with a matching filename."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    response = client.post(
        "/api/convert",
        files={"file": ("pages.pdf", buf.getvalue(), "application/pdf")},
        data={"target_format": "png"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert ".zip" in response.headers["content-disposition"]
    import zipfile
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    assert len(archive.namelist()) == 2


def test_native_txt_to_pdf_conversion():
    """Verify converting plain text to PDF produces a valid vector PDF."""
    txt_content = b"OmniConverter Native Text to PDF Test Document\nLine 1\nLine 2\nLine 3"
    response = client.post(
        "/api/convert",
        files={"file": ("notes.txt", txt_content, "text/plain")},
        data={"target_format": "pdf"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    reader = PdfReader(io.BytesIO(response.content))
    assert len(reader.pages) >= 1


def test_csv_and_xlsx_conversions():
    """Verify CSV can round-trip through JSON and XLSX outputs."""
    csv_content = b"Name,Role,XP\nAlice,Admin,500\nBob,User,250"
    response_json = client.post(
        "/api/convert",
        files={"file": ("users.csv", csv_content, "text/csv")},
        data={"target_format": "json"}
    )
    assert response_json.status_code == 200
    assert response_json.json()[0]["Name"] == "Alice"

    response_xlsx = client.post(
        "/api/convert",
        files={"file": ("users.csv", csv_content, "text/csv")},
        data={"target_format": "xlsx"}
    )
    assert response_xlsx.status_code == 200
    import openpyxl
    workbook = openpyxl.load_workbook(io.BytesIO(response_xlsx.content), read_only=True)
    assert workbook.active.cell(row=2, column=1).value == "Alice"
    workbook.close()

    source_workbook = openpyxl.Workbook()
    sheet = source_workbook.active
    sheet.append(["Name", "Role"])
    sheet.append(["Carol", "Editor"])
    xlsx_buf = io.BytesIO()
    source_workbook.save(xlsx_buf)
    response_csv = client.post(
        "/api/convert",
        files={"file": ("users.xlsx", xlsx_buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"target_format": "csv"}
    )
    assert response_csv.status_code == 200
    assert b"Name,Role" in response_csv.content
    assert b"Carol,Editor" in response_csv.content


def test_unsupported_conversion_is_reported():
    """Unsupported extensions should be rejected instead of returning a fake conversion."""
    response = client.post(
        "/api/convert",
        files={"file": ("unknown.exe", b"not a supported input", "application/octet-stream")},
        data={"target_format": "pdf"}
    )
    assert response.status_code == 415


def test_native_json_to_txt_conversion():
    """Verify native JSON data conversion to plain text."""
    json_content = b'{"status": "ok", "message": "OmniConverter running"}'
    response = client.post(
        "/api/convert",
        files={"file": ("status.json", json_content, "application/json")},
        data={"target_format": "txt"}
    )
    assert response.status_code == 200
    assert b"OmniConverter running" in response.content


def test_pptx_conversions():
    """Verify PPTX conversions to PDF, TXT, and HTML."""
    from pptx import Presentation
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    slide.shapes.title.text = "Omni Presentation Test"
    slide.placeholders[1].text = "Subtitle point 1\nSubtitle point 2"
    pptx_buf = io.BytesIO()
    prs.save(pptx_buf)
    pptx_bytes = pptx_buf.getvalue()

    # PPTX -> PDF
    res_pdf = client.post(
        "/api/convert",
        files={"file": ("deck.pptx", pptx_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
        data={"target_format": "pdf"}
    )
    assert res_pdf.status_code == 200
    assert len(res_pdf.content) > 500
    pdf_text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(res_pdf.content)).pages)
    assert "Omni Presentation Test" in pdf_text
    assert "Subtitle point 1" in pdf_text

    # PPTX -> TXT
    res_txt = client.post(
        "/api/convert",
        files={"file": ("deck.pptx", pptx_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
        data={"target_format": "txt"}
    )
    assert res_txt.status_code == 200
    assert b"Omni Presentation Test" in res_txt.content

    # PPTX -> HTML
    res_html = client.post(
        "/api/convert",
        files={"file": ("deck.pptx", pptx_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
        data={"target_format": "html"}
    )
    assert res_html.status_code == 200
    assert b"Omni Presentation Test" in res_html.content


def test_docx_and_pdf_roundtrip_conversions():
    """Verify DOCX to PDF and PDF to DOCX conversions."""
    import docx
    doc = docx.Document()
    doc.add_heading("Omni DOCX Test", 0)
    doc.add_paragraph("Testing DOCX to PDF and back.")
    buf = io.BytesIO()
    doc.save(buf)
    docx_bytes = buf.getvalue()

    # DOCX -> PDF
    res_pdf = client.post(
        "/api/convert",
        files={"file": ("document.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"target_format": "pdf"}
    )
    assert res_pdf.status_code == 200
    assert len(res_pdf.content) > 500

    # PDF -> DOCX
    res_docx = client.post(
        "/api/convert",
        files={"file": ("document.pdf", res_pdf.content, "application/pdf")},
        data={"target_format": "docx"}
    )
    assert res_docx.status_code == 200
    assert len(res_docx.content) > 500


def test_html_and_yaml_conversions():
    """Verify HTML to PDF and YAML to JSON conversions."""
    html_bytes = b"<!DOCTYPE html><html><body><h1>Header</h1><p>Paragraph content</p></body></html>"
    res_html = client.post(
        "/api/convert",
        files={"file": ("page.html", html_bytes, "text/html")},
        data={"target_format": "pdf"}
    )
    assert res_html.status_code == 200
    assert len(res_html.content) > 500

    yaml_bytes = b"title: OmniConverter\nversion: 5.0\nmode: production\n"
    res_yaml = client.post(
        "/api/convert",
        files={"file": ("config.yaml", yaml_bytes, "application/x-yaml")},
        data={"target_format": "json"}
    )
    assert res_yaml.status_code == 200
    data = res_yaml.json()
    assert data["title"] == "OmniConverter"


def test_history_and_stats_management():
    """Verify DELETE /api/history and POST /api/stats/reset."""
    # Reset stats
    resp_reset = client.post("/api/stats/reset")
    assert resp_reset.status_code == 200
    assert resp_reset.json()["stats"]["filesConverted"] == 0

    # Clear history
    resp_del = client.delete("/api/history")
    assert resp_del.status_code == 200
    assert resp_del.json()["status"] == "success"


