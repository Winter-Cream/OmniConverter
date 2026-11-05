"""Background watch-folder conversion with stable-file and restart handling."""

import json
import os
import shutil
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional

from converter_engine import converter_engine


def is_file_ready(file_path: Path) -> bool:
    """Return whether a non-empty file can be opened for reading."""
    try:
        if not file_path.is_file() or file_path.stat().st_size == 0:
            return False
        with file_path.open("rb"):
            return True
    except (PermissionError, OSError):
        return False


class WatchFolderDaemon:
    def __init__(self, db_path: Path, db_lock: Optional[threading.Lock] = None, poll_interval: float = 1.0):
        self.db_path = Path(db_path)
        self.db_lock = db_lock or threading.Lock()
        self.poll_interval = max(0.1, poll_interval)
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._state_lock = threading.Lock()
        self._stop_event = threading.Event()
        self._observed: Dict[str, tuple[int, int]] = {}
        self._failed_items: Dict[str, tuple[int, int]] = {}

    @staticmethod
    def _fingerprint(path: Path) -> tuple[int, int]:
        stat = path.stat()
        return stat.st_size, stat.st_mtime_ns

    def start(self):
        with self._state_lock:
            if self._thread and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, name="OmniWatchFolder", daemon=True)
            self._thread.start()
        print("[Watch Folder Daemon]: Daemon thread started.")

    def stop(self, timeout: float = 5.0):
        with self._state_lock:
            self._running = False
            self._stop_event.set()
            thread = self._thread
        if thread and thread is not threading.current_thread():
            thread.join(timeout=max(0.0, timeout))
        print("[Watch Folder Daemon]: Daemon stopping...")

    def is_running(self) -> bool:
        with self._state_lock:
            return self._running and bool(self._thread and self._thread.is_alive())

    def _read_db(self) -> Dict[str, Any]:
        with self.db_lock:
            try:
                with self.db_path.open("r", encoding="utf-8") as file:
                    value = json.load(file)
                return value if isinstance(value, dict) else {}
            except (OSError, json.JSONDecodeError):
                return {}

    def _update_stats(self, content_len: int, filename: str, target_fmt: str):
        with self.db_lock:
            try:
                with self.db_path.open("r", encoding="utf-8") as file:
                    db = json.load(file)
                db["filesConverted"] = db.get("filesConverted", 0) + 1
                db["bytesProcessed"] = db.get("bytesProcessed", 0) + content_len
                db["xp"] = db.get("xp", 0) + 30
                db.setdefault("history", []).insert(0, {
                    "name": filename,
                    "target": target_fmt.upper(),
                    "size": f"{round(content_len / 1024, 1)} KB",
                    "timestamp": time.strftime("%H:%M:%S"),
                })
                db["history"] = db["history"][:50]
                temp_db = self.db_path.with_suffix(self.db_path.suffix + ".tmp")
                with temp_db.open("w", encoding="utf-8") as file:
                    json.dump(db, file, indent=2)
                os.replace(temp_db, self.db_path)
            except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
                print(f"[Watch Daemon DB Update Warning]: {exc}")

    @staticmethod
    def _non_overwriting_path(directory: Path, filename: str) -> Path:
        candidate = directory / filename
        if not candidate.exists():
            return candidate
        stem, suffix = candidate.stem, candidate.suffix
        index = 2
        while True:
            candidate = directory / f"{stem} ({index}){suffix}"
            if not candidate.exists():
                return candidate
            index += 1

    def _process_file(self, item: Path, out_dir: Path, target_fmt: str):
        fingerprint = self._fingerprint(item)
        key = str(item.resolve())
        if self._failed_items.get(key) == fingerprint:
            return
        if not is_file_ready(item):
            return
        if self._observed.get(key) != fingerprint:
            self._observed[key] = fingerprint
            return

        try:
            content = item.read_bytes()
            result = converter_engine.convert_file(content, item.name, target_fmt)
            if not result.success or not result.output_path or not os.path.isfile(result.output_path):
                raise RuntimeError(result.error or "Converter produced no output file.")

            out_file = self._non_overwriting_path(out_dir, result.filename)
            temp_output = out_file.with_name(f".{out_file.name}.{threading.get_ident()}.tmp")
            try:
                shutil.copyfile(result.output_path, temp_output)
                os.replace(temp_output, out_file)
            finally:
                temp_output.unlink(missing_ok=True)
                shutil.rmtree(Path(result.output_path).parent, ignore_errors=True)

            try:
                item.unlink()
            except OSError as exc:
                # Keep the converted output and avoid duplicate conversions until
                # the source changes or is removed.
                self._failed_items[key] = fingerprint
                print(f"[Watch Folder Warning]: Could not remove {item.name}: {exc}")
            else:
                self._failed_items.pop(key, None)
                self._observed.pop(key, None)
            self._update_stats(len(content), item.name, target_fmt)
            print(f"[Watch Folder]: Converted {item.name} -> {out_file.name}")
        except Exception as exc:
            self._failed_items[key] = fingerprint
            print(f"[Watch Folder Conversion Failed]: {item.name}: {exc}")

    def _run_loop(self):
        try:
            while not self._stop_event.is_set():
                try:
                    watch = self._read_db().get("watchFolder", {})
                    if watch.get("enabled"):
                        in_dir = Path(watch.get("path", "")).resolve()
                        out_dir = Path(watch.get("output_path", "")).resolve()
                        target_fmt = str(watch.get("target_format", "pdf")).lower().lstrip(".")
                        overlaps = in_dir == out_dir or in_dir in out_dir.parents or out_dir in in_dir.parents
                        if in_dir.is_dir() and not overlaps:
                            out_dir.mkdir(parents=True, exist_ok=True)
                            for item in in_dir.iterdir():
                                if self._stop_event.is_set():
                                    break
                                if item.is_file() and not item.name.startswith("."):
                                    self._process_file(item, out_dir, target_fmt)
                        else:
                            print(f"[Watch Folder Warning]: Input directory does not exist: {in_dir}")
                except Exception as exc:
                    print(f"[Watch Folder Daemon Error]: {exc}")
                self._stop_event.wait(self.poll_interval)
        finally:
            with self._state_lock:
                self._running = False
