"""Coverage for format detection, plugin resolution, and shortest-path routing."""
import io
from pathlib import Path
import subprocess
import tempfile
import pytest

from PIL import Image

from conversion_architecture import find_conversion_path
from converter_engine import OmniConverterEngine, get_ffmpeg_executable
from pypdf import PdfWriter


def test_magic_detection_recovers_misnamed_webp():
    buffer = io.BytesIO()
    Image.new("RGB", (3, 3), "red").save(buffer, format="WEBP")
    engine = OmniConverterEngine()
    assert engine.detect_format(buffer.getvalue(), "picture.jpg") == "webp"


def test_breadth_first_route_returns_shortest_chain():
    graph = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": ["e"]}
    assert find_conversion_path("a", "e", graph) == ["a", "b", "d", "e"]
    assert find_conversion_path("e", "a", graph) is None


def test_conversion_registry_resolves_document_plugin():
    engine = OmniConverterEngine()
    assert engine.registry.resolve("txt", "pdf").name == "documents"
    assert engine.registry.resolve("txt", "mp4") is None


def test_image_metadata_inspection_and_scrub():
    image = Image.new("RGB", (16, 16), "blue")
    exif = image.getexif()
    exif[272] = "OmniTest Camera"
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", exif=exif)
    engine = OmniConverterEngine()
    original = buffer.getvalue()

    assert engine.inspect_metadata(original, "camera.jpg")["fields"]["Camera model"] == "OmniTest Camera"
    converted = engine.convert_file(original, "camera.jpg", "jpg", {"strip_metadata": True})
    assert converted.success, converted.error
    stripped = engine.inspect_metadata(Path(converted.output_path).read_bytes(), "camera.jpg")
    assert "Camera model" not in stripped["fields"]


def test_pdf_metadata_scrub_removes_document_author():
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    writer.add_metadata({"/Author": "OmniTest Author"})
    buffer = io.BytesIO()
    writer.write(buffer)
    engine = OmniConverterEngine()
    original = buffer.getvalue()

    assert engine.inspect_metadata(original, "author.pdf")["fields"]["Author"] == "OmniTest Author"
    converted = engine.convert_file(original, "author.pdf", "pdf", {"strip_metadata": True})
    assert converted.success, converted.error
    stripped = engine.inspect_metadata(Path(converted.output_path).read_bytes(), "author.pdf")
    assert "Author" not in stripped["fields"]


def test_size_preset_resolves_email_budget_and_image_conversion():
    buffer = io.BytesIO()
    Image.new("RGB", (128, 128), "green").save(buffer, format="PNG")
    engine = OmniConverterEngine()
    assert engine._target_size_bytes({"target_size_preset": "email_2mb"}) == 2 * 1024 * 1024
    result = engine.convert_file(buffer.getvalue(), "small.png", "webp", {"target_size_preset": "email_2mb"})
    assert result.success, result.error
    assert Path(result.output_path).stat().st_size <= 2 * 1024 * 1024


def test_ffmpeg_video_and_audio_conversions(tmp_path):
    ffmpeg = get_ffmpeg_executable()
    assert ffmpeg, "FFmpeg should be available from PATH or the bundled imageio-ffmpeg package"
    source = tmp_path / "sample.mp4"
    subprocess.run(
        [ffmpeg, "-y", "-f", "lavfi", "-i", "testsrc=size=160x120:rate=12",
         "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100", "-t", "1.5",
         "-c:v", "mpeg4", "-c:a", "aac", str(source)],
        check=True, capture_output=True, timeout=60,
    )
    engine = OmniConverterEngine()

    for target in ("webm", "mp3", "gif"):
        result = engine.convert_file(source.read_bytes(), source.name, target)
        assert result.success, f"MP4 to {target} failed: {result.error}"
        assert Path(result.output_path).stat().st_size > 0


def test_ffmpeg_bundled_fallback_when_system_binary_is_absent(monkeypatch):
    import imageio_ffmpeg
    monkeypatch.setattr("converter_engine.shutil.which", lambda _name: None)
    assert get_ffmpeg_executable() == imageio_ffmpeg.get_ffmpeg_exe()


@pytest.mark.parametrize("extension", ["py", "js", "ts", "sql", "java", "c", "cpp", "rs", "go"])
def test_advertised_code_to_pdf_conversions(extension):
    result = OmniConverterEngine().convert_file(b"print('sample')\n", f"sample.{extension}", "pdf")
    assert result.success, f"{extension} to PDF failed: {result.error}"


def test_html_htm_normalization_and_wav_to_ogg():
    html_result = OmniConverterEngine().convert_file(b"<html><body>ok</body></html>", "sample.htm", "html")
    assert html_result.success, html_result.error

    ffmpeg = get_ffmpeg_executable()
    assert ffmpeg
    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / "tone.wav"
        subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.8", str(source)],
                       check=True, capture_output=True, timeout=60)
        for target in ("mp3", "wav", "ogg", "flac", "aac"):
            result = OmniConverterEngine().convert_file(source.read_bytes(), source.name, target)
            assert result.success, f"WAV to {target} failed: {result.error}"
