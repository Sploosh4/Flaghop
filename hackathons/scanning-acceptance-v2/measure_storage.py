#!/usr/bin/env python3
"""Observe an owned test command's write directories; do not prune any files.

16 MiB applies to FINAL RETAINED OUTPUT ONLY. More storage during execution is
allowed and recorded separately. This observer never stops a process for crossing
the retained-output target. Peak targets are evaluated after measurement.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import time

sys.dont_write_bytecode = True
from acceptance import tree_size


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, type=Path, help="NEW final run directory; command creates it")
    parser.add_argument("--work", required=True, type=Path, help="NEW temporary workspace; supplied as TMPDIR")
    parser.add_argument("--shared", required=True, type=Path, help="Dedicated shared runtime/cache directory, possibly existing")
    parser.add_argument("--output", required=True, type=Path, help="NEW JSON trace outside observed roots")
    parser.add_argument("--interval", type=float, default=0.2)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command or not 0.05 <= args.interval <= 0.5:
        parser.error("Supply a command and interval between 0.05 and 0.5 seconds")
    roots = [p.resolve() for p in (args.run, args.work, args.shared)]
    for i, root in enumerate(roots):
        for other in roots[i + 1:]:
            if root == other or root.is_relative_to(other) or other.is_relative_to(root):
                parser.error("Use disjoint run, work and shared directories to avoid double counting")
    if roots[0].exists() or roots[1].exists() or args.output.exists():
        parser.error("Run/work/output paths must be new; historical artifacts are never overwritten")
    if any(args.output.resolve().is_relative_to(root) for root in roots):
        parser.error("Put the trace outside the observed directories")
    roots[1].mkdir(mode=0o700, parents=True)
    roots[2].mkdir(mode=0o700, parents=True, exist_ok=True)
    environment = os.environ.copy()
    environment.update(TMPDIR=str(roots[1]), PYTHONDONTWRITEBYTECODE="1")
    started = time.monotonic()
    samples = []
    bad_links = {}
    process = subprocess.Popen(command, env=environment)
    try:
        while True:
            sample_time = time.monotonic()
            sizes = [tree_size(root) for root in roots]
            for size in sizes:
                for link in size["symlinks"]:
                    target = Path(link["target"])
                    if not any(target.is_relative_to(root) for root in roots):
                        bad_links[link["path"]] = link["target"]
            samples.append({"seconds": round(sample_time - started, 4),
                            "logical_bytes": sum(s["logical_bytes"] for s in sizes),
                            "allocated_bytes": sum(s["allocated_bytes"] for s in sizes),
                            "run_bytes": sizes[0]["logical_bytes"],
                            "work_bytes": sizes[1]["logical_bytes"],
                            "shared_bytes": sizes[2]["logical_bytes"]})
            if process.poll() is not None:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        raise
    report = {"measured_at": datetime.now(timezone.utc).isoformat(),
              "command": command, "run_root": str(roots[0]), "work_root": str(roots[1]),
              "shared_root": str(roots[2]), "exit_code": process.returncode,
              "samples": len(samples), "requested_interval_seconds": args.interval,
              "max_sample_interval_seconds": max((b["seconds"] - a["seconds"] for a, b in zip(samples, samples[1:])), default=0),
              "peak_logical_bytes": max(s["logical_bytes"] for s in samples),
              "peak_allocated_bytes": max(s["allocated_bytes"] for s in samples),
              "run_final_bytes": samples[-1]["run_bytes"],
              "work_final_bytes": samples[-1]["work_bytes"],
              "shared_final_bytes": samples[-1]["shared_bytes"],
              "unaccounted_symlinks": bad_links, "measurements": samples,
              "limitations": "Sampled high-water mark, not a kernel-enforced quota. Declare all writable roots; writes outside them are not measured. Existing installed dependencies and historical runs are excluded."}
    with args.output.open("x") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps({k: report[k] for k in ("exit_code", "peak_logical_bytes", "run_final_bytes", "work_final_bytes", "shared_final_bytes")}))
    return process.returncode


if __name__ == "__main__":
    raise SystemExit(main())
