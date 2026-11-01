#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
exec .venv/bin/python -m hash_watch watch --watch examples/inbox --out examples/results \
  --wordlist examples/deep-seeds.txt --batch-size 16 \
  --benchmark-profile validation/laptop/benchmark.json "$@"
