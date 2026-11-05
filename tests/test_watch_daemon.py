import json
import time

from pypdf import PdfReader

from watch_daemon import WatchFolderDaemon


def test_watch_daemon_converts_stable_file_and_updates_stats(tmp_path):
    input_dir = tmp_path / "input"
    output_dir = tmp_path / "output"
    input_dir.mkdir()
    db_path = tmp_path / "state.json"
    db_path.write_text(json.dumps({
        "filesConverted": 0,
        "bytesProcessed": 0,
        "history": [],
        "watchFolder": {
            "enabled": True,
            "path": str(input_dir),
            "output_path": str(output_dir),
            "target_format": "pdf",
        },
    }), encoding="utf-8")

    daemon = WatchFolderDaemon(db_path, poll_interval=0.1)
    daemon.start()
    source = input_dir / "watched.txt"
    source.write_text("Watch folder integration test", encoding="utf-8")

    try:
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline and source.exists():
            time.sleep(0.05)
        assert not source.exists(), "Successfully converted source should be removed from the inbox."
        result = output_dir / "watched_converted.pdf"
        assert result.exists()
        reader = PdfReader(str(result))
        assert len(reader.pages) == 1
        assert "Watch folder integration test" in reader.pages[0].extract_text()

        state = json.loads(db_path.read_text(encoding="utf-8"))
        assert state["filesConverted"] == 1
        assert state["history"][0]["name"] == "watched.txt"
    finally:
        daemon.stop()

    assert not daemon.is_running()


def test_watch_daemon_retries_changed_failure_without_overwriting(tmp_path):
    input_dir = tmp_path / "input"
    output_dir = tmp_path / "output"
    input_dir.mkdir()
    output_dir.mkdir()
    db_path = tmp_path / "state.json"
    db_path.write_text(json.dumps({
        "filesConverted": 0,
        "bytesProcessed": 0,
        "history": [],
        "watchFolder": {
            "enabled": True,
            "path": str(input_dir),
            "output_path": str(output_dir),
            "target_format": "txt",
        },
    }), encoding="utf-8")
    existing_output = output_dir / "data_converted.txt"
    existing_output.write_text("keep existing output", encoding="utf-8")

    source = input_dir / "data.json"
    source.write_text("not valid json", encoding="utf-8")
    daemon = WatchFolderDaemon(db_path, poll_interval=0.1)
    daemon.start()
    key = str(source.resolve())
    try:
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline and key not in daemon._failed_items:
            time.sleep(0.05)
        assert key in daemon._failed_items, "Invalid JSON should be recorded as a failed conversion."

        source.write_text('{"content":"fixed and retried"}', encoding="utf-8")
        retry_output = output_dir / "data_converted (2).txt"
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline and source.exists():
            time.sleep(0.05)
        assert not source.exists(), "A changed file should be retried and removed after success."
        assert existing_output.read_text(encoding="utf-8") == "keep existing output"
        assert retry_output.read_text(encoding="utf-8") == "fixed and retried"
    finally:
        daemon.stop()
