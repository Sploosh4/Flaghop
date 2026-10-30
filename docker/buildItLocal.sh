#!/usr/bin/env bash
set -euo pipefail
legion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
exec docker build -f "$legion_root/Dockerfile" -t legion:local "$legion_root" "$@"
