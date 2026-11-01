#!/usr/bin/env bash
set -euo pipefail
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SOURCE_DIR/../.." && pwd)"
python3 "$PROJECT_DIR/skills/project-storage-cap/scripts/storage_guard.py" --root "$PROJECT_DIR" --check
UV_CACHE_DIR="$PROJECT_DIR/.cache/uv" uv pip install --upgrade --python "$PROJECT_DIR/.venv/bin/python" -r "$SOURCE_DIR/requirements.txt"
bash "$PROJECT_DIR/scripts/update-security-tools.sh" --only john hashcat
python3 "$PROJECT_DIR/skills/project-storage-cap/scripts/storage_guard.py" --root "$PROJECT_DIR" --check
