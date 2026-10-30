#!/usr/bin/env bash
# Launch this checkout using its dedicated environment; installation is explicit.
set -euo pipefail
legion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$legion_root/.project-storage.json" ]]; then
    python3 "$legion_root/skills/project-storage-cap/scripts/storage_guard.py" --root "$legion_root" --check
fi
export LEGION_HOME="$legion_root/.state/config"
export TMPDIR="$legion_root/.state/tmp"
export XDG_CACHE_HOME="$legion_root/.cache"
export PYTHONDONTWRITEBYTECODE=1
mkdir -p "$LEGION_HOME" "$TMPDIR" "$XDG_CACHE_HOME"
cd "$legion_root"
exec "$legion_root/.venv/bin/python" "$legion_root/legion.py" "$@"
