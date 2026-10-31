"""Sequential, synthetic desktop resource check at 0 and 1,000 saved runs.

Uses the existing UI assertions and a bounded list of 200 cards. Memory figures
are sampled process-tree RSS/PSS (RSS double counts shared pages); they are not
an exact allocation trace or a hard memory quota. No network scanner is launched.
"""

import json
import os
from pathlib import Path
import subprocess
import sys
import time
import uuid
import psutil

ROOT = Path(__file__).resolve().parents[2]


def measure(count, artifacts):
    env = dict(
        os.environ,
        LEGION_SCANNER_SMOKE_HISTORY=str(count),
        LEGION_SCANNER_SMOKE_ARTIFACTS=str(artifacts),
        PYTHONDONTWRITEBYTECODE="1",
        QT_QPA_PLATFORM="offscreen",
        QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --no-sandbox",
        TMPDIR=str(ROOT / ".tmp"),
        XDG_CACHE_HOME=str(ROOT / ".cache"),
    )
    artifacts.mkdir(parents=True)
    started, rss_peak, pss_peak, samples, denied = time.monotonic(), 0, 0, 0, 0
    with (artifacts / "command.log").open("wb") as output:
        process = psutil.Popen(
            [sys.executable, "-B", str(ROOT / "tests/desktop/scanner_smoke.py")],
            cwd=ROOT,
            env=env,
            stdout=output,
            stderr=subprocess.STDOUT,
        )
        while process.poll() is None:
            if time.monotonic() - started > 60:
                children = process.children(recursive=True)
                for child in children:
                    try:
                        child.kill()
                    except psutil.NoSuchProcess:
                        pass
                process.kill()
                process.wait()
                raise TimeoutError("Synthetic desktop did not finish within 60 seconds.")
            rss, pss = 0, 0
            try:
                processes = [process, *process.children(recursive=True)]
            except psutil.NoSuchProcess:
                processes = []
            for child in processes:
                try:
                    info = child.memory_full_info()
                    rss += info.rss
                    pss += info.pss
                except psutil.NoSuchProcess:
                    pass
                except (psutil.AccessDenied, AttributeError):
                    denied += 1
            rss_peak, pss_peak = max(rss_peak, rss), max(pss_peak, pss)
            samples += 1
            time.sleep(0.25)
        exit_code = process.wait()
    result = json.loads((artifacts / "checks-asgi.json").read_text())
    passed = exit_code == 0 and all(row["result"] is True for row in result["checks"]) and not result["js_errors"]
    return {
        "saved_runs": count,
        "exit_code": exit_code,
        "checks": len(result["checks"]),
        "passed": passed,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "rss_peak_bytes": rss_peak,
        "pss_peak_bytes": pss_peak if samples and not denied else None,
        "samples": samples,
        "unreadable_process_samples": denied,
        "artifacts": str(artifacts),
    }


def main():
    subprocess.run(
        [sys.executable, "skills/project-storage-cap/scripts/storage_guard.py", "--root", str(ROOT), "--check"],
        cwd=ROOT,
        check=True,
    )
    attempt = ROOT / ".artifacts/disposable/scanner-resources" / uuid.uuid4().hex
    cases = [measure(count, attempt / str(count)) for count in (0, 1000)]
    report = {
        "cases": cases,
        "passed": all(case["passed"] for case in cases),
        "memory_scope": "Sampled process-tree PSS and RSS; short-lived peaks can fall between samples.",
    }
    (attempt / "report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report))
    subprocess.run(
        [sys.executable, "skills/project-storage-cap/scripts/storage_guard.py", "--root", str(ROOT), "--check"],
        cwd=ROOT,
        check=True,
    )
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
