#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python_bin="${LEGION_PYTHON:-.venv/bin/python}"
export PYTHONDONTWRITEBYTECODE=1
export LEGION_HOME="$PWD/.artifacts/disposable/check-home"
export XDG_CACHE_HOME="$PWD/.cache"
export TMPDIR="$PWD/.tmp"
export QT_QPA_PLATFORM=offscreen
export TZ=Australia/Perth
mkdir -p "$LEGION_HOME" "$XDG_CACHE_HOME" "$TMPDIR"
"$python_bin" scripts/check-contracts.py
"$python_bin" -m black --check app db parsers pipettes plugins legion.py tests scripts/export-openapi.py scripts/frontend-notices.py scripts/update-scanner.py scripts/check-contracts.py
"$python_bin" -m flake8 app db parsers pipettes plugins legion.py tests scripts/export-openapi.py scripts/frontend-notices.py scripts/update-scanner.py scripts/check-contracts.py
"$python_bin" -m unittest
