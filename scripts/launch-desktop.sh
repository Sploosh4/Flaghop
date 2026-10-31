#!/usr/bin/env bash
set -euo pipefail
legion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$legion_root/.project-storage.json" ]] && ! mountpoint --quiet "$legion_root"; then
    printf '%s\n' 'The capped FlagHop project filesystem is not mounted. Refusing to create uncapped runtime files.' >&2
    exit 1
fi
export LEGION_HOME="$legion_root/.state/config"
export TMPDIR="$legion_root/.state/tmp"
export XDG_CACHE_HOME="$legion_root/.cache"
export PYTHONDONTWRITEBYTECODE=1
export PATH="$legion_root/.venv/bin:$PATH"
mkdir -p "$LEGION_HOME" "$TMPDIR" "$XDG_CACHE_HOME"
systemctl --user start legion.service
for attempt in {1..100}; do
    if curl --silent --fail --output /dev/null http://127.0.0.1:5000/; then
        cd "$legion_root"
        exec "$legion_root/.venv/bin/python" -m app.desktop
    fi
    sleep 0.2
done
printf '%s\n' 'FlagHop did not become ready. View its log with: journalctl --user -u legion.service -n 50' >&2
exit 1
