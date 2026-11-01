#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
exec .venv/bin/python -m cipher_watch --watch examples/inbox --out examples/results "$@"
