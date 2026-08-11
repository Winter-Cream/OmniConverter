"""
OmniConverter PRO 4.0 Ultra - Watch Folder Automation Daemon
Monitors specified input directory in background thread and auto-converts files to target format.
"""

import os
import time
import json
import threading
from pathlib import Path
from typing import Dict, Any, Optional

from converter_engine import converter_engine

class WatchFolderDaemon:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._running = False
        self._thread: Optional[threading.Thread] = None

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

    def _run_loop(self):
        while self._running:
            try:
                if self.db_path.exists():
                    with open(self.db_path, "r", encoding="utf-8") as f:
                        db = json.load(f)

                    wf_info = db.get("watchFolder", {})
                    if wf_info.get("enabled"):
                        in_dir = Path(wf_info.get("path", "./watch_input"))
                        out_dir = Path(wf_info.get("output_path", "./watch_output"))
                        target_fmt = wf_info.get("target_format", "pdf")

                        if in_dir.exists():
                            out_dir.mkdir(parents=True, exist_ok=True)
                            for item in in_dir.iterdir():
                                if item.is_file() and not item.name.startswith("."):
                                    print(f"[Watch Folder]: Converting {item.name} -> {target_fmt}")
                                    with open(item, "rb") as rf:
                                        content = rf.read()
                                    res = converter_engine.convert_file(content, item.name, target_fmt)
                                    if res.success and os.path.exists(res.output_path):
                                        out_file = out_dir / res.filename
                                        with open(res.output_path, "rb") as sf, open(out_file, "wb") as df:
                                            df.write(sf.read())
                                        try:
                                            item.unlink()
                                        except Exception:
                                            pass
                                        
                                        db["filesConverted"] = db.get("filesConverted", 0) + 1
                                        db["bytesProcessed"] = db.get("bytesProcessed", 0) + len(content)
                                        with open(self.db_path, "w", encoding="utf-8") as wf:
                                            json.dump(db, wf, indent=2)
            except Exception as e:
                print(f"[Watch Folder Daemon Error]: {e}")
            time.sleep(3)
