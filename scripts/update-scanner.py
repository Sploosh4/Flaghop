#!/usr/bin/env python3
"""Check a scanner snapshot; write only after reviewing its candidate digest/diff."""

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.scanning.bundle import compare, install
from app.scanning.source import BUNDLE


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--write", action="store_true")
    parser.add_argument("--expected-manifest", default="")
    args = parser.parse_args()
    try:
        files, manifest, report = compare(args.source, BUNDLE)
        if args.write:
            install(BUNDLE, files, manifest, args.expected_manifest)
            report["written"] = True
        print(json.dumps(report, indent=2))
        return 0 if args.write or report["matched"] else 1
    except (ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
