#!/usr/bin/env python3
"""Run the same contract quality gate locally and in CI."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.validation.contract_check import check_contracts

if __name__ == "__main__":
    diagnostics = check_contracts(ROOT)
    if diagnostics:
        print("\n".join(diagnostics))
        print("Repair the owning definition; do not bypass this check. See docs/contract-authoring.md.")
        raise SystemExit(1)
    print("Contract checks passed: ownership, folder contents, dependencies, class roots and field schemas.")
