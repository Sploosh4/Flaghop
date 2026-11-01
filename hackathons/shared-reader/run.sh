#!/usr/bin/env bash
set -euo pipefail
SHARED_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SHARED_DIR"
exec "$SHARED_DIR/../hash-watch/.venv/bin/python" -m shared_reader "$@"
