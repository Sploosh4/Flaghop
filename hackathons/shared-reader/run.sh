#!/usr/bin/env bash
set -euo pipefail
SHARED_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SHARED_DIR/../.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$SHARED_DIR"
exec "${FLAGHOP_PYTHON:-$PROJECT_DIR/.venv/bin/python}" -m shared_reader "$@"
