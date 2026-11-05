"""Tests for safe cleanup of request and crash-orphaned temp artifacts."""
import os
import time

import server


def test_cleanup_temp_file_removes_only_generated_directory(tmp_path, monkeypatch):
    monkeypatch.setattr(server.tempfile, "gettempdir", lambda: str(tmp_path))
    generated = tmp_path / "omni_ocr_result"
    generated.mkdir()
    (generated / "result.txt").write_text("temporary", encoding="utf-8")
    unrelated = tmp_path / "user_files"
    unrelated.mkdir()
    (unrelated / "keep.txt").write_text("keep", encoding="utf-8")

    server.cleanup_temp_file(str(generated / "result.txt"))
    server.cleanup_temp_file(str(unrelated / "keep.txt"))

    assert not generated.exists()
    assert (unrelated / "keep.txt").exists()


def test_stale_cleanup_removes_old_artifacts_and_preserves_recent_dirs(tmp_path, monkeypatch):
    monkeypatch.setattr(server.tempfile, "gettempdir", lambda: str(tmp_path))
    old = tmp_path / "omni_conv_orphan"
    recent = tmp_path / "omni_pdf_active"
    unrelated = tmp_path / "other_cache"
    for directory in (old, recent, unrelated):
        directory.mkdir()
    (old / "output.bin").write_bytes(b"old")
    os.utime(old, (time.time() - 1000, time.time() - 1000))

    removed = server.cleanup_stale_temp_dirs(max_age_seconds=100)

    assert removed == 1
    assert not old.exists()
    assert recent.exists()
    assert unrelated.exists()
