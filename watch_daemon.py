"""
OmniConverter PRO 4.0 Ultra - Watch Folder Automation Daemon
Monitors specified input directory in background thread and auto-converts files to target format.
Includes Windows file-ready checks, thread-safe DB synchronization, and infinite-loop prevention.
"""

import os
import time
import json
import threading
from pathlib import Path
from typing import Dict, Any, Optional, Set

from converter_engine import converter_engine


def is_file_ready(file_path: Path) -> bool:
    """Verifies whether the file is finished copying and can be safely read."""
    try:
        if not file_path.exists() or file_path.stat().st_size == 0:
            return False
        # Try opening in append mode to test write-lock release
        with open(file_path, "a+b"):
            pass
        return True
    except (PermissionError, OSError):
        return False


class WatchFolderDaemon:
    def __init__(self, db_path: Path, db_lock: Optional[threading.Lock] = None):
        self.db_path = db_path
        self.db_lock = db_lock or threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._failed_items: Set[str] = set()

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print("[Watch Folder Daemon]: Daemon thread started.")

    def stop(self):
        self._running = False
        print("[Watch Folder Daemon]: Daemon stopping...")

    def is_running(self) -> bool:
        return self._running

    def _read_db(self) -> Dict[str, Any]:
        with self.db_lock:
            try:
                if self.db_path.exists():
                    with open(self.db_path, "r", encoding="utf-8") as f:
                        return json.load(f)
            except Exception as e:
                print(f"[Watch Daemon DB Read Warning]: {e}")
        return {}

    def _update_stats(self, content_len: int, filename: str, target_fmt: str):
        with self.db_lock:
            try:
                if self.db_path.exists():
                    with open(self.db_path, "r", encoding="utf-8") as f:
                        db = json.load(f)
                    db["filesConverted"] = db.get("filesConverted", 0) + 1
                    db["bytesProcessed"] = db.get("bytesProcessed", 0) + content_len
                    db["xp"] = db.get("xp", 0) + 30
                    
                    hist_entry = {
                        "name": filename,
                        "target": target_fmt.upper(),
                        "size": f"{round(content_len / 1024, 1)} KB",
                        "timestamp": time.strftime("%H:%M:%S")
                    }
                    db.setdefault("history", []).insert(0, hist_entry)
                    db["history"] = db["history"][:50]
                    
                    with open(self.db_path, "w", encoding="utf-8") as wf:
                        json.dump(db, wf, indent=2)
            except Exception as e:
                print(f"[Watch Daemon DB Update Warning]: {e}")

    def _run_loop(self):
        while self._running:
            try:
                db = self._read_db()
                wf_info = db.get("watchFolder", {})
                if wf_info.get("enabled"):
                    in_dir = Path(wf_info.get("path", "./watch_input")).resolve()
                    out_dir = Path(wf_info.get("output_path", "./watch_output")).resolve()
                    target_fmt = wf_info.get("target_format", "pdf")

                    if in_dir.exists():
                        out_dir.mkdir(parents=True, exist_ok=True)
                        for item in in_dir.iterdir():
                            if not self._running:
                                break
                            if not item.is_file() or item.name.startswith(".") or item.name in self._failed_items:
                                continue

                            # Verify file is completely copied and unlocked
                            if not is_file_ready(item):
                                continue

                            print(f"[Watch Folder]: Converting {item.name} -> {target_fmt}")
                            try:
                                with open(item, "rb") as rf:
                                    content = rf.read()
                                
                                res = converter_engine.convert_file(content, item.name, target_fmt)
                                if res.success and os.path.exists(res.output_path):
                                    out_file = out_dir / res.filename
                                    with open(res.output_path, "rb") as sf, open(out_file, "wb") as df:
                                        df.write(sf.read())
                                    
                                    # Clean up processed input file
                                    try:
                                        item.unlink()
                                    except Exception as e_del:
                                        print(f"[Watch Folder Warning]: Could not remove {item.name}: {e_del}")
                                        self._failed_items.add(item.name)

                                    self._update_stats(len(content), item.name, target_fmt)
                                else:
                                    print(f"[Watch Folder Conversion Failed]: {item.name}: {res.error}")
                                    self._failed_items.add(item.name)
                            except Exception as e_proc:
                                print(f"[Watch Folder Process Error]: {item.name}: {e_proc}")
                                self._failed_items.add(item.name)

            except Exception as e:
                print(f"[Watch Folder Daemon Error]: {e}")
            time.sleep(3)
