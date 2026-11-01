#!/usr/bin/env bash
set -euo pipefail
legion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$legion_root/.state/container"
exec docker run --rm -p 127.0.0.1:5000:5000 -v "$legion_root/.state/container:/var/lib/legion" "$@" legion:local
