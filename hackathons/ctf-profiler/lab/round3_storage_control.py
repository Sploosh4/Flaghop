#!/usr/bin/env python3
"""Harmless measured-storage control: transient 24 MiB in TMPDIR, tiny output."""
from pathlib import Path
import os
import sys
import time

work = Path(os.environ["TMPDIR"])
work.mkdir(parents=True, exist_ok=True)
transient = work / "control-24m.bin"
transient.write_bytes(b"x" * (24 * 1024 * 1024))
time.sleep(0.8)
transient.unlink()
run = Path(sys.argv[1])
run.mkdir(parents=True, exist_ok=False)
(run / "result.txt").write_text("control complete\n")
print("control complete")
