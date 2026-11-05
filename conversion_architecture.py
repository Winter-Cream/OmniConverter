"""Small, dependency-free building blocks for conversion routing and plugins."""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Callable, Iterable, Protocol


class ConverterPlugin(Protocol):
    """Standard interface for a converter that can perform one format step."""

    name: str

    def supports(self, source: str, target: str) -> bool: ...

    def convert(self, source_path: str, output_path: str, source: str, target: str,
                options: dict, stem: str) -> None: ...


@dataclass
class NativeConverterPlugin:
    """Adapter that lets existing native converters participate in the plugin registry."""

    name: str
    formats: frozenset[str]
    targets: dict[str, list[str]]
    handler: Callable[[str, str, str, str, dict, str], None]

    def supports(self, source: str, target: str) -> bool:
        return source in self.formats and target in self.targets.get(source, ())

    def convert(self, source_path: str, output_path: str, source: str, target: str,
                options: dict, stem: str) -> None:
        self.handler(source_path, output_path, source, target, options, stem)


class ConverterRegistry:
    """Ordered strategy registry; the first registered capable plugin handles a step."""

    def __init__(self) -> None:
        self._plugins: list[ConverterPlugin] = []

    def register(self, plugin: ConverterPlugin) -> None:
        self._plugins.append(plugin)

    def resolve(self, source: str, target: str) -> ConverterPlugin | None:
        return next((plugin for plugin in self._plugins if plugin.supports(source, target)), None)


def find_conversion_path(source: str, target: str, targets: dict[str, Iterable[str]]) -> list[str] | None:
    """Return the shortest declared conversion chain using breadth-first search."""
    source, target = source.lower().lstrip("."), target.lower().lstrip(".")
    if source == target:
        return [source]
    queue = deque([(source, [source])])
    visited = {source}
    while queue:
        current, path = queue.popleft()
        for next_format in targets.get(current, ()):
            next_format = next_format.lower().lstrip(".")
            if next_format in visited:
                continue
            next_path = [*path, next_format]
            if next_format == target:
                return next_path
            visited.add(next_format)
            queue.append((next_format, next_path))
    return None


def detect_file_format(data: bytes, filename: str, supported: set[str]) -> str | None:
    """Detect recognizable binary containers by signature, falling back to a supported suffix."""
    from pathlib import Path

    suffix = Path(filename).suffix.lower().lstrip(".")
    head = data[:4096]
    detected: str | None = None
    if head.startswith(b"%PDF-"):
        detected = "pdf"
    elif head.startswith(b"\x89PNG\r\n\x1a\n"):
        detected = "png"
    elif head.startswith(b"\xff\xd8\xff"):
        detected = "jpg"
    elif head.startswith((b"GIF87a", b"GIF89a")):
        detected = "gif"
    elif head.startswith(b"BM"):
        detected = "bmp"
    elif head.startswith((b"II*\x00", b"MM\x00*")):
        detected = "tiff"
    elif head.startswith(b"\x00\x00\x01\x00"):
        detected = "ico"
    elif len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        detected = "webp"
    elif head.startswith(b"fLaC"):
        detected = "flac"
    elif head.startswith(b"OggS"):
        detected = "ogg"
    elif head.startswith(b"ID3") or head.startswith(b"\xff\xfb") or head.startswith(b"\xff\xf3"):
        detected = "mp3"
    elif head.startswith(b"RIFF") and head[8:12] == b"WAVE":
        detected = "wav"
    elif len(head) >= 12 and head[4:8] == b"ftyp":
        brand = head[8:12].lower()
        detected = "m4a" if brand in (b"m4a ", b"m4b ", b"m4p ") else ("mov" if brand in (b"qt  ",) else "mp4")
    elif head.startswith(b"\x1aE\xdf\xa3"):
        detected = "webm" if b"webm" in head.lower() else "mkv"
    elif head.startswith(b"PK\x03\x04"):
        try:
            import io
            import zipfile
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                names = set(archive.namelist())
                if "[Content_Types].xml" in names:
                    if any(name.startswith("word/") for name in names): detected = "docx"
                    elif any(name.startswith("ppt/") for name in names): detected = "pptx"
                    elif any(name.startswith("xl/") for name in names): detected = "xlsx"
        except (OSError, zipfile.BadZipFile):
            pass
    if detected in supported:
        return detected
    return suffix if suffix in supported else None
